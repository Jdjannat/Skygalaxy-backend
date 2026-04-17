const crypto = require('node:crypto');

function registerContactRoutes(
  app,
  {
    upload,
    requireAuth,
    readJson,
    writeJson,
    contactsFile,
    validateEmail,
    sendContactEmails,
    sendEmailSync = false,
    requestTimeoutMs = 20000,
  }
) {
  app.post(
    '/api/contact',
    (req, res, next) => {
      req.setTimeout(requestTimeoutMs, () => {
        if (!res.headersSent) {
          res.status(408).json({
            success: false,
            message: 'Contact request timed out while receiving data.',
          });
        }
      });

      return next();
    },
    upload.single('attachment'),
    async (req, res) => {
    const { name, email, phone, company, requirement, message } = req.body || {};
    const attachment = req.file || null;

    if (!name || !email || !requirement || !message) {
      return res.status(400).json({
        success: false,
        message: 'name, email, requirement and message are required',
      });
    }

    if (!validateEmail(String(email))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
      });
    }

    const contacts = readJson(contactsFile, []);
    const newContact = {
      id: crypto.randomUUID(),
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      phone: phone ? String(phone).trim() : '',
      company: company ? String(company).trim() : '',
      requirement: String(requirement).trim(),
      message: String(message).trim(),
      createdAt: new Date().toISOString(),
    };

    contacts.push(newContact);
    writeJson(contactsFile, contacts);

    if (sendEmailSync) {
      let mailResult;
      try {
        mailResult = await sendContactEmails(newContact, attachment);
      } catch (error) {
        console.error('Contact email sending failed:', error.message);
        return res.status(500).json({
          success: false,
          message: 'Contact saved, but email sending failed. Please check SMTP settings.',
        });
      }

      console.log('Contact email status:', JSON.stringify(mailResult));

      return res.status(201).json({
        success: true,
        message: 'Thank you for contacting us. We will get back to you soon.',
        data: {
          id: newContact.id,
          attachment: attachment
            ? {
                name: attachment.originalname,
                size: attachment.size,
                mimeType: attachment.mimetype,
              }
            : null,
          mail: mailResult,
        },
      });
    }

    sendContactEmails(newContact, attachment)
      .then((mailResult) => {
        console.log('Contact email status:', JSON.stringify(mailResult));
      })
      .catch((error) => {
        console.error('Background contact email sending failed:', error.message);
      });

    return res.status(201).json({
      success: true,
      message: 'Thank you for contacting us. We will get back to you soon.',
      data: {
        id: newContact.id,
        attachment: attachment
          ? {
              name: attachment.originalname,
              size: attachment.size,
              mimeType: attachment.mimetype,
            }
          : null,
        mail: {
          queued: true,
        },
      },
    });
    }
  );

  app.get('/api/inquiries', requireAuth, (req, res) => {
    const contacts = readJson(contactsFile, []);
    const all = Array.isArray(contacts) ? contacts : [];

    const search = typeof req.query.search === 'string' ? req.query.search.trim().toLowerCase() : '';
    const filtered = search
      ? all.filter(
          (c) =>
            (c.name && c.name.toLowerCase().includes(search)) ||
            (c.email && c.email.toLowerCase().includes(search)) ||
            (c.company && c.company.toLowerCase().includes(search)) ||
            (c.requirement && c.requirement.toLowerCase().includes(search)) ||
            (c.message && c.message.toLowerCase().includes(search))
        )
      : all;

    const pageRaw = parseInt(req.query.page, 10);
    const limitRaw = parseInt(req.query.limit, 10);
    const page = pageRaw > 0 ? pageRaw : 1;
    const limit = limitRaw > 0 ? Math.min(limitRaw, 100) : 20;
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const data = filtered.slice(start, start + limit);

    return res.json({
      success: true,
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    });
  });

  app.get('/api/inquiries/:id', requireAuth, (req, res) => {
    const { id } = req.params;
    const contacts = readJson(contactsFile, []);

    if (!Array.isArray(contacts)) {
      return res.status(500).json({
        success: false,
        message: 'Unable to read inquiries data',
      });
    }

    const contact = contacts.find((c) => c && c.id === id);
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Inquiry not found',
      });
    }

    return res.json({
      success: true,
      data: contact,
    });
  });

  app.put('/api/inquiries/:id', requireAuth, (req, res) => {
    const { id } = req.params;
    const contacts = readJson(contactsFile, []);

    if (!Array.isArray(contacts)) {
      return res.status(500).json({
        success: false,
        message: 'Unable to read inquiries data',
      });
    }

    const index = contacts.findIndex((contact) => contact && contact.id === id);
    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: 'Inquiry not found',
      });
    }

    const incoming = req.body || {};
    const updates = {};

    if (Object.prototype.hasOwnProperty.call(incoming, 'name')) {
      updates.name = String(incoming.name || '').trim();
    }
    if (Object.prototype.hasOwnProperty.call(incoming, 'email')) {
      const email = String(incoming.email || '').trim().toLowerCase();
      if (!email || !validateEmail(email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format',
        });
      }
      updates.email = email;
    }
    if (Object.prototype.hasOwnProperty.call(incoming, 'phone')) {
      updates.phone = String(incoming.phone || '').trim();
    }
    if (Object.prototype.hasOwnProperty.call(incoming, 'company')) {
      updates.company = String(incoming.company || '').trim();
    }
    if (Object.prototype.hasOwnProperty.call(incoming, 'requirement')) {
      updates.requirement = String(incoming.requirement || '').trim();
    }
    if (Object.prototype.hasOwnProperty.call(incoming, 'message')) {
      updates.message = String(incoming.message || '').trim();
    }
    if (Object.prototype.hasOwnProperty.call(incoming, 'status')) {
      updates.status = String(incoming.status || '').trim();
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Provide at least one field to update',
      });
    }

    const updatedContact = {
      ...contacts[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    contacts[index] = updatedContact;
    writeJson(contactsFile, contacts);

    return res.json({
      success: true,
      message: 'Inquiry updated successfully',
      data: updatedContact,
    });
  });

  app.delete('/api/inquiries/:id', requireAuth, (req, res) => {
    const { id } = req.params;
    const contacts = readJson(contactsFile, []);

    if (!Array.isArray(contacts)) {
      return res.status(500).json({
        success: false,
        message: 'Unable to read inquiries data',
      });
    }

    const index = contacts.findIndex((contact) => contact && contact.id === id);
    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: 'Inquiry not found',
      });
    }

    const [deletedContact] = contacts.splice(index, 1);
    writeJson(contactsFile, contacts);

    return res.json({
      success: true,
      message: 'Inquiry deleted successfully',
      data: {
        id: deletedContact.id,
      },
    });
  });
}

module.exports = {
  registerContactRoutes,
};

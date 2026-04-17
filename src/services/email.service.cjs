const nodemailer = require('nodemailer');

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderEmailShell(title, intro, bodyHtml) {
  return `
<div style="margin:0;padding:24px;background:#f4f7fb;font-family:Segoe UI,Arial,sans-serif;color:#172033;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #e5ebf5;border-radius:12px;overflow:hidden;">
    <tr>
      <td style="padding:24px 28px;background:linear-gradient(135deg,#09203f,#1b3f73);color:#ffffff;">
        <h1 style="margin:0;font-size:20px;font-weight:700;">${escapeHtml(title)}</h1>
        <p style="margin:8px 0 0;font-size:14px;line-height:1.5;color:#d7e6ff;">${escapeHtml(intro)}</p>
      </td>
    </tr>
    <tr>
      <td style="padding:24px 28px;">${bodyHtml}</td>
    </tr>
    <tr>
      <td style="padding:16px 28px;border-top:1px solid #eef2f8;font-size:12px;color:#6d7a92;">
        This is an automated email from SkyGalaxy Infotech.
      </td>
    </tr>
  </table>
</div>`;
}

function detailRow(label, value) {
  return `
<tr>
  <td style="padding:10px 12px;border:1px solid #d9e2f0;background:#f8fbff;font-weight:600;width:170px;vertical-align:top;">${escapeHtml(label)}</td>
  <td style="padding:10px 12px;border:1px solid #d9e2f0;vertical-align:top;">${escapeHtml(value || '-')}</td>
</tr>`;
}

function createContactEmailSender({ mailFrom, mailTo, smtpService, smtpUser, smtpPass }) {
  function canSendEmail() {
    return Boolean(smtpUser && smtpPass);
  }

  function createTransporter() {
    return nodemailer.createTransport({
      service: smtpService,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
  }

  return async function sendContactEmails(contact, attachment) {
    if (!canSendEmail()) {
      console.warn('Email not sent: SMTP_PASS is missing in skygalaxy-backed/.env');
      return {
        skipped: true,
        reason: 'SMTP_PASS is missing',
      };
    }

    const transporter = createTransporter();

    const adminSubject = `New Contact Form: ${contact.name}`;
    const adminText = [
      'You received a new contact form submission.',
      '',
      `Name: ${contact.name}`,
      `Email: ${contact.email}`,
      `Phone: ${contact.phone || '-'}`,
      `Company: ${contact.company || '-'}`,
      `Requirement: ${contact.requirement}`,
      `Message: ${contact.message}`,
      `Attachment: ${attachment ? attachment.originalname : '-'}`,
      `Submitted At: ${contact.createdAt}`,
    ].join('\n');

    const adminHtml = renderEmailShell(
      'New Contact Form Submission',
      'A new inquiry was submitted on your website.',
      `
<p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#2e3d56;">
  Review the contact details below and follow up with the customer.
</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;font-size:14px;color:#1f2a3d;">
  ${detailRow('Name', contact.name)}
  ${detailRow('Email', contact.email)}
  ${detailRow('Phone', contact.phone || '-')}
  ${detailRow('Company', contact.company || '-')}
  ${detailRow('Requirement', contact.requirement)}
  ${detailRow('Message', contact.message)}
  ${detailRow('Attachment', attachment ? attachment.originalname : '-')}
  ${detailRow('Submitted At', contact.createdAt)}
</table>`
    );

    const customerSubject = 'Thank you for contacting SkyGalaxy Infotech';
    const customerText = [
      `Hello ${contact.name},`,
      '',
      'Thank you for contacting us. We have received your request and will get back to you soon.',
      '',
      'Your submitted details:',
      `Requirement: ${contact.requirement}`,
      `Message: ${contact.message}`,
      '',
      'Regards,',
      'SkyGalaxy Infotech Team',
    ].join('\n');

    const customerHtml = renderEmailShell(
      'Thank You for Contacting SkyGalaxy Infotech',
      `Hi ${contact.name}, we have received your message.`,
      `
<p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#2e3d56;">
  Thank you for reaching out to us. Our team will review your requirement and get back to you shortly.
</p>
<div style="margin:0 0 16px;padding:14px 16px;border:1px solid #d9e2f0;border-left:4px solid #1b3f73;background:#f8fbff;border-radius:6px;">
  <p style="margin:0 0 8px;font-size:13px;color:#4c5a71;"><strong>Requirement:</strong> ${escapeHtml(contact.requirement)}</p>
  <p style="margin:0;font-size:13px;color:#4c5a71;"><strong>Message:</strong> ${escapeHtml(contact.message)}</p>
</div>
<p style="margin:0;font-size:14px;line-height:1.7;color:#2e3d56;">
  Regards,<br />
  <strong>SkyGalaxy Infotech Team</strong>
</p>`
    );

    const adminMailResult = await transporter.sendMail({
      from: mailFrom,
      to: mailTo,
      replyTo: contact.email,
      subject: adminSubject,
      text: adminText,
      html: adminHtml,
      attachments: attachment
        ? [
            {
              filename: attachment.originalname,
              content: attachment.buffer,
              contentType: attachment.mimetype,
            },
          ]
        : [],
    });

    const customerMailResult = await transporter.sendMail({
      from: mailFrom,
      to: contact.email,
      subject: customerSubject,
      text: customerText,
      html: customerHtml,
    });

    return {
      skipped: false,
      admin: {
        accepted: adminMailResult.accepted,
        rejected: adminMailResult.rejected,
        messageId: adminMailResult.messageId,
        response: adminMailResult.response,
      },
      customer: {
        accepted: customerMailResult.accepted,
        rejected: customerMailResult.rejected,
        messageId: customerMailResult.messageId,
        response: customerMailResult.response,
      },
    };
  };
}

module.exports = {
  createContactEmailSender,
};

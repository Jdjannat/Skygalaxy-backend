const crypto = require('node:crypto');

function normalizeCareerPayload(input = {}) {
  const payload = {};

  if (Object.prototype.hasOwnProperty.call(input, 'jobTitle')) {
    payload.jobTitle = String(input.jobTitle || '').trim();
  }
  if (Object.prototype.hasOwnProperty.call(input, 'department')) {
    payload.department = String(input.department || '').trim();
  }
  if (Object.prototype.hasOwnProperty.call(input, 'location')) {
    payload.location = String(input.location || '').trim();
  }
  if (Object.prototype.hasOwnProperty.call(input, 'employmentType')) {
    payload.employmentType = String(input.employmentType || '').trim();
  }
  if (Object.prototype.hasOwnProperty.call(input, 'status')) {
    payload.status = String(input.status || '').trim();
  }
  if (Object.prototype.hasOwnProperty.call(input, 'experience')) {
    payload.experience = String(input.experience || '').trim();
  }
  if (Object.prototype.hasOwnProperty.call(input, 'fullDescription')) {
    payload.fullDescription = String(input.fullDescription || '').trim();
  }

  return payload;
}

function validateRequiredCareerFields(payload) {
  const requiredFields = [
    'jobTitle',
    'department',
    'location',
    'employmentType',
    'status',
    'experience',
    'fullDescription',
  ];

  const missing = requiredFields.filter((field) => !payload[field]);
  return {
    isValid: missing.length === 0,
    missing,
  };
}

function registerCareersRoutes(
  app,
  {
    readJson,
    writeJson,
    careersFile,
  }
) {
  // GET /api/careers - Get all careers with pagination and search
  app.get('/api/careers', (req, res) => {
    try {
      const careers = readJson(careersFile, []);
      const all = Array.isArray(careers) ? careers : [];

      const search = typeof req.query.search === 'string' ? req.query.search.trim().toLowerCase() : '';
      const filtered = search
        ? all.filter(
            (c) =>
              (c.jobTitle && c.jobTitle.toLowerCase().includes(search)) ||
              (c.department && c.department.toLowerCase().includes(search)) ||
              (c.location && c.location.toLowerCase().includes(search)) ||
              (c.employmentType && c.employmentType.toLowerCase().includes(search)) ||
              (c.status && c.status.toLowerCase().includes(search)) ||
              (c.experience && c.experience.toLowerCase().includes(search)) ||
              (c.fullDescription && c.fullDescription.toLowerCase().includes(search))
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
    } catch (error) {
      console.error('Error fetching careers:', error);
      return res.status(500).json({
        success: false,
        message: 'Unable to fetch careers',
      });
    }
  });

  // GET /api/careers/:id - Get single career by ID
  app.get('/api/careers/:id', (req, res) => {
    try {
      const { id } = req.params;
      const careers = readJson(careersFile, []);

      if (!Array.isArray(careers)) {
        return res.status(500).json({
          success: false,
          message: 'Unable to read careers data',
        });
      }

      const career = careers.find((c) => c && c.id === id);
      if (!career) {
        return res.status(404).json({
          success: false,
          message: 'Career not found',
        });
      }

      return res.json({
        success: true,
        data: career,
      });
    } catch (error) {
      console.error('Error fetching career:', error);
      return res.status(500).json({
        success: false,
        message: 'Unable to fetch career',
      });
    }
  });

  // POST /api/careers - Create new career
  app.post('/api/careers', (req, res) => {
    try {
      const incoming = normalizeCareerPayload(req.body || {});
      const { isValid, missing } = validateRequiredCareerFields(incoming);

      if (!isValid) {
        return res.status(400).json({
          success: false,
          message: `Missing required fields: ${missing.join(', ')}`,
        });
      }

      const careers = readJson(careersFile, []);

      const newCareer = {
        id: crypto.randomUUID(),
        ...incoming,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      careers.push(newCareer);
      writeJson(careersFile, careers);

      return res.status(201).json({
        success: true,
        message: 'Career created successfully',
        data: newCareer,
      });
    } catch (error) {
      console.error('Error creating career:', error);
      return res.status(500).json({
        success: false,
        message: 'Unable to create career',
      });
    }
  });

  // PUT /api/careers/:id - Update career
  app.put('/api/careers/:id', (req, res) => {
    try {
      const { id } = req.params;
      const careers = readJson(careersFile, []);

      if (!Array.isArray(careers)) {
        return res.status(500).json({
          success: false,
          message: 'Unable to read careers data',
        });
      }

      const index = careers.findIndex((c) => c && c.id === id);
      if (index === -1) {
        return res.status(404).json({
          success: false,
          message: 'Career not found',
        });
      }

      const updates = normalizeCareerPayload(req.body || {});

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Provide at least one field to update',
        });
      }

      const emptyFields = Object.keys(updates).filter((key) => !updates[key]);
      if (emptyFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: `These fields cannot be empty: ${emptyFields.join(', ')}`,
        });
      }

      const updatedCareer = {
        ...careers[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      careers[index] = updatedCareer;
      writeJson(careersFile, careers);

      return res.json({
        success: true,
        message: 'Career updated successfully',
        data: updatedCareer,
      });
    } catch (error) {
      console.error('Error updating career:', error);
      return res.status(500).json({
        success: false,
        message: 'Unable to update career',
      });
    }
  });

  // DELETE /api/careers/:id - Delete career
  app.delete('/api/careers/:id', (req, res) => {
    try {
      const { id } = req.params;
      const careers = readJson(careersFile, []);

      if (!Array.isArray(careers)) {
        return res.status(500).json({
          success: false,
          message: 'Unable to read careers data',
        });
      }

      const index = careers.findIndex((c) => c && c.id === id);
      if (index === -1) {
        return res.status(404).json({
          success: false,
          message: 'Career not found',
        });
      }

      const [deletedCareer] = careers.splice(index, 1);
      writeJson(careersFile, careers);

      return res.json({
        success: true,
        message: 'Career deleted successfully',
        data: {
          id: deletedCareer.id,
        },
      });
    } catch (error) {
      console.error('Error deleting career:', error);
      return res.status(500).json({
        success: false,
        message: 'Unable to delete career',
      });
    }
  });
}
module.exports = {
  registerCareersRoutes,
};

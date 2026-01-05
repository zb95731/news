const express = require('express');
const db = require('../db');

const router = express.Router();

// Role Management

// Get all roles
router.get('/roles', (req, res) => {
  const sql = `
    SELECT r.*, COUNT(u.id) as user_count
    FROM roles r
    LEFT JOIN users u ON r.id = u.role_id
    GROUP BY r.id
    ORDER BY r.id
  `;
  
  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Get role by ID
router.get('/roles/:id', (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM roles WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'Role not found.' });
    }
    
    // Get role permissions
    db.all(
      'SELECT p.* FROM permissions p JOIN role_permissions rp ON p.id = rp.permission_id WHERE rp.role_id = ?',
      [id],
      (err, permissions) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        res.json({
          ...row,
          permissions
        });
      }
    );
  });
});

// Create role
router.post('/roles', (req, res) => {
  const { name, description, permissions = [] } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Role name is required.' });
  }
  
  // Check if role name already exists
  db.get('SELECT id FROM roles WHERE name = ?', [name], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (row) {
      return res.status(400).json({ error: 'Role name already exists.' });
    }
    
    // Create role
    db.run(
      'INSERT INTO roles (name, description) VALUES (?, ?)',
      [name, description],
      function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        const roleId = this.lastID;
        
        // Assign permissions if provided
        if (permissions.length > 0) {
          const insertPermissions = permissions.map(permissionId => {
            return db.run(
              'INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)',
              [roleId, permissionId]
            );
          });
        }
        
        res.status(201).json({
          id: roleId,
          name,
          description,
          message: 'Role created successfully.'
        });
      }
    );
  });
});

// Update role
router.put('/roles/:id', (req, res) => {
  const { id } = req.params;
  const { name, description, permissions = [] } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Role name is required.' });
  }
  
  // Check if role exists
  db.get('SELECT id FROM roles WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'Role not found.' });
    }
    
    // Check if role name is already used by another role
    db.get('SELECT id FROM roles WHERE name = ? AND id != ?', [name, id], (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (row) {
        return res.status(400).json({ error: 'Role name already exists.' });
      }
      
      // Update role
      db.run(
        'UPDATE roles SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [name, description, id],
        (err) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          
          // Update role permissions
          // 1. Remove existing permissions
          db.run('DELETE FROM role_permissions WHERE role_id = ?', [id], (err) => {
            if (err) {
              return res.status(500).json({ error: err.message });
            }
            
            // 2. Add new permissions
            if (permissions.length > 0) {
              const insertPermissions = permissions.map(permissionId => {
                return db.run(
                  'INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)',
                  [id, permissionId]
                );
              });
            }
            
            res.json({
              id: parseInt(id),
              name,
              description,
              message: 'Role updated successfully.'
            });
          });
        }
      );
    });
  });
});

// Delete role
router.delete('/roles/:id', (req, res) => {
  const { id } = req.params;
  
  // Check if role is used by any user
  db.get('SELECT id FROM users WHERE role_id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (row) {
      return res.status(400).json({ error: 'Cannot delete role. It is used by existing users.' });
    }
    
    // Delete role permissions first
    db.run('DELETE FROM role_permissions WHERE role_id = ?', [id], (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      // Delete role
      db.run('DELETE FROM roles WHERE id = ?', [id], (err) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        res.json({ message: 'Role deleted successfully.' });
      });
    });
  });
});

// Permission Management

// Get all permissions
router.get('/permissions', (req, res) => {
  const sql = `
    SELECT p.*, COUNT(rp.role_id) as role_count
    FROM permissions p
    LEFT JOIN role_permissions rp ON p.id = rp.permission_id
    GROUP BY p.id
    ORDER BY p.resource, p.action
  `;
  
  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Get permission by ID
router.get('/permissions/:id', (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM permissions WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'Permission not found.' });
    }
    
    res.json(row);
  });
});

// Create permission
router.post('/permissions', (req, res) => {
  const { name, description, resource, action } = req.body;
  
  if (!name || !resource || !action) {
    return res.status(400).json({ error: 'Name, resource and action are required.' });
  }
  
  // Check if permission already exists
  db.get(
    'SELECT id FROM permissions WHERE name = ? OR (resource = ? AND action = ?)',
    [name, resource, action],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (row) {
        return res.status(400).json({ error: 'Permission already exists.' });
      }
      
      // Create permission
      db.run(
        'INSERT INTO permissions (name, description, resource, action) VALUES (?, ?, ?, ?)',
        [name, description, resource, action],
        function(err) {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          
          res.status(201).json({
            id: this.lastID,
            name,
            description,
            resource,
            action,
            message: 'Permission created successfully.'
          });
        }
      );
    }
  );
});

// Update permission
router.put('/permissions/:id', (req, res) => {
  const { id } = req.params;
  const { name, description, resource, action } = req.body;
  
  if (!name || !resource || !action) {
    return res.status(400).json({ error: 'Name, resource and action are required.' });
  }
  
  // Check if permission exists
  db.get('SELECT id FROM permissions WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'Permission not found.' });
    }
    
    // Check if permission name or (resource, action) pair already exists
    db.get(
      'SELECT id FROM permissions WHERE (name = ? OR (resource = ? AND action = ?)) AND id != ?',
      [name, resource, action, id],
      (err, row) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        if (row) {
          return res.status(400).json({ error: 'Permission already exists.' });
        }
        
        // Update permission
        db.run(
          'UPDATE permissions SET name = ?, description = ?, resource = ?, action = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [name, description, resource, action, id],
          (err) => {
            if (err) {
              return res.status(500).json({ error: err.message });
            }
            
            res.json({
              id: parseInt(id),
              name,
              description,
              resource,
              action,
              message: 'Permission updated successfully.'
            });
          }
        );
      }
    );
  });
});

// Delete permission
router.delete('/permissions/:id', (req, res) => {
  const { id } = req.params;
  
  // Delete permission from role_permissions first
  db.run('DELETE FROM role_permissions WHERE permission_id = ?', [id], (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    // Delete permission
    db.run('DELETE FROM permissions WHERE id = ?', [id], (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      res.json({ message: 'Permission deleted successfully.' });
    });
  });
});

module.exports = router;

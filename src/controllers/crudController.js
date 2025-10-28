import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Universal CRUD controller factory
export function createCRUDController(modelName) {
  const model = prisma[modelName];
  if (!model) throw new Error(`Invalid Prisma model name: ${modelName}`);

  // select mapping for sensitive data
  const safeSelect = {
    user: {
      id: true,
      username: true,
      name: true,
      email: true,
      phoneNumber: true,
      pictureUrl: true,
      role: true,
    },
    host: {
      id: true,
      username: true,
      name: true,
      email: true,
      phoneNumber: true,
      pictureUrl: true,
      aboutMe: true,
      role: true,
    },
  };

  return {
    // GET all (with query filters)
    getAll: async (req, res) => {
      try {
        const filters = {};

        if (modelName === "user" && req.query.username) {
          filters.username = { contains: req.query.username };
        }

        if (modelName === "user" && req.query.email) {
          filters.email = { contains: req.query.email };
        }

        if (modelName === "host" && req.query.name) {
          filters.name = { contains: req.query.name };
        }

        if (modelName === "booking" && req.query.userId) {
          filters.userId = req.query.userId;
        }

        if (modelName === "property") {
          if (req.query.location) {
            filters.location = { contains: req.query.location };
          }
          if (req.query.pricePerNight) {
            filters.pricePerNight = Number(req.query.pricePerNight);
          }
        }

        const items = await model.findMany({
          where: filters,
          select: safeSelect[modelName] || undefined,
        });

        // With no results
        if (items.length === 0) {
          return res.status(404).json({ error: "No results found" });
        }

        res.json(items);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    },

    // GET by ID
    getById: async (req, res) => {
      const id = req.params.id;
      const item = await model.findUnique({
        where: { id },
        select: safeSelect[modelName] || undefined,
      });
      if (!item) return res.status(404).json({ error: "Not found" });
      res.json(item);
    },

    // CREATE
    create: async (req, res) => {
      try {
        if (modelName === "user" || modelName === "host") {
          const { username } = req.body;

          // Username is required for these models
          if (!username) {
            return res
              .status(400)
              .json({ error: "Username is required for this model." });
          }

          // Only check username (email can be duplicated)
          const existing = await model.findUnique({
            where: { username },
          });

          if (existing) {
            return res.status(409).json({
              error: `${modelName} with this username already exists.`,
            });
          }
        }

        const newItem = await model.create({ data: req.body });
        res.status(201).json(newItem);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    },

    // UPDATE
    update: async (req, res) => {
      const id = req.params.id;
      try {
        const updated = await model.update({
          where: { id },
          data: req.body,
        });
        res.json(updated);
      } catch (error) {
        if (error.code === "P2025")
          return res.status(404).json({ error: "Not found" });
        res.status(400).json({ error: error.message });
      }
    },

    // DELETE
    remove: async (req, res) => {
      const id = req.params.id;
      try {
        await model.delete({ where: { id } });
        res.json({ message: "Deleted successfully" });
      } catch (error) {
        if (error.code === "P2025")
          return res.status(404).json({ error: "Not found" });
        res.status(400).json({ error: error.message });
      }
    },
  };
}

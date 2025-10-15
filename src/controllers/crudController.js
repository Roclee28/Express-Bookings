import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Universal CRUD controller factory
export function createCRUDController(modelName) {
  const model = prisma[modelName];
  if (!model) throw new Error(`Invalid Prisma model name: ${modelName}`);

  return {
    // GET all
    getAll: async (req, res) => {
      const items = await model.findMany();
      res.json(items);
    },

    // GET by ID
    getById: async (req, res) => {
      const id = req.params.id;
      const item = await model.findUnique({ where: { id } });
      if (!item) return res.status(404).json({ error: "Not found" });
      res.json(item);
    },

    // CREATE
    create: async (req, res) => {
      try {
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

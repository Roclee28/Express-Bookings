import express from "express";
import { createCRUDController } from "../controllers/crudController.js";

const router = express.Router();
const controller = createCRUDController("user");

router.get("/", controller.getAll);
router.get("/:id", controller.getById);
router.post("/", controller.create);
router.put("/:id", controller.update);
router.delete("/:id", controller.remove);

export default router;

import { Router } from "express";

import {create, getAll, getTarefa, updateTarefa, updateStatusTarefa, getTarefaPorSituacao} from '../controllers/tarefaController.js'

const router = Router()


router.post("/", create)
router.get("/",getAll)
router.get("/:id",getTarefa )
router.put("/:id", updateTarefa)
router.patch("/:id/status", updateStatusTarefa)
router.get("/status/:situacao", getTarefaPorSituacao)

export default router; 
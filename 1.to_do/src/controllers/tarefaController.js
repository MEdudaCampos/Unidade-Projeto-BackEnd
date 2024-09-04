import { request, response } from "express";
import Tarefa from "../models/tarefaModel.js";
import { z } from "zod";
import formatZodError from "../helpers/zodError.js";

// export const getAll = async (request, response) => {
//   try {
//     const tarefas = await Tarefa.findAll();
//     response.status(200).json(tarefas);
//   } catch (error) {
//     response.status(500).json({ message: "Erro ao listar tarefas" });
//   }
// };

// validaçõs com ZOD
const createShema = z.object({
  tarefa: z
    .string()
    .min(3, { message: "A tarefa deve ter pelo menos 3 caracteres" })
    .transform((txt) => txt.toLocaleLowerCase()),
  descricao: z
    .string()
    .min(5, { message: "A descrição deve ter pelo menos 3 caracteres" }),
});

const getSchema = z.object({
  id: z.string().uuid({ message: "Id da tarefa está iválido" }),
});

const buscarTarefaPorSistuacaoShwm = z.object({
  situacao: z.enum(["pendente", "concluida"]),
});

const updateTarefaSchema = z.object({
  tarefa: z
    .string()
    .min(3, { message: "A tarefa deve ter pelo menos 3 caracteres" })
    .transforme((txt) => txt.toLocaleLowerCase()),
  descricao: z
    .string()
    .min(3, { message: "A descrição deve ter pelo menos 5 caracteres" }),
  situacao: z.nativeEnum(["pendente", "concluida"]),
});

// tarefas?page=2&limit=10
export const getAll = async (request, response) => {
  const page = parseInt(request.query.page) || 1;
  const limit = parseInt(request.query.limit) || 10;
  const offset = (page - 1) * limit;
  try {
    const tarefas = await Tarefa.findAndCountAll({
      limit,
      offset,
    });
    // console.log(page,limit, offset)
    // console.log(tarefas);
    const totalPaginas = Math.ceil(tarefas.count / limit);
    response.status(200).json({
      totalTarefas: tarefas.count,
      totalPaginas,
      paginaAtual: page,
      itemsPorPagina: limit,
      proximaPagina:
        totalPaginas === 0
          ? null
          : `http://localhost:3333/tarefas?page=${page + 1}`,
      tarefas: tarefas.rows,
    });
  } catch (error) {
    response.status(500).json({ message: "Erro ao buscar tarefas" });
  }
};
// cria tarefa
export const create = async (request, response) => {
  // implementar a validação

  const bodyValidation = createShema.safeParse(request.body);
  // console.log(bodyValidation)
  if (bodyValidation.success) {
    response
      .status(404)
      .json({
        message: "Os dados recebidos do corpo da aplicação são inválidos",
        detalhes: bodyValidation.error,
      });
    return;
  }
  const { tarefa, descricao } = request.body;
  const status = "pendente";
  const novaTarefa = {
    tarefa,
    descricao,
    status,
  };
  try {
    // criar cadastro
    await Tarefa.create(novaTarefa);
    response.status(201).json({ message: "Tarefa Cadastrada" });
  } catch (error) {
    console.error(error);
    response.status(500).json({ message: "Erro ao cadastrar tarefa" });
  }
};
// busca tarefa por id
export const getTarefa = async (request, response) => {
  const paramValidator = getSchema.safeParse(request.params);
  if (!paramValidator.success) {
    response.status(400).json({
      message: "Número de identidicação está inválido",
      detalhes: formatZodError(paramValidator.error),
    });
    return;
  }
  const { id } = request.params;
  try {
    const tarefaId = await Tarefa.findOne({ where: { id } });
    if (Tarefa === null) {
      response.status(404).json({ message: "Tarefa não encontrada" });
      return;
    }

    response.status(200).json(tarefaId);
  } catch (error) {
    response.status(500).json({ err: "Erro ao buscar tarefa por id" });
    return;
  }
};
export const updateTarefa = async (request, response) => {
  const paramValidator = getSchema.safeParse(request.params);
  if(!paramValidator.success){
    response.status(400).json({
      message: "Número de identificação está inválido",
      details: formatZodError(paramValidator.error)
    });
    return
  }

  const updateValidator = updateTarefaSchema.safeParse(request.body)
  if(!updateValidator.success){
    response.status(400).json({ 
      message:"Dados para atualização estão incorretos",
      details: formatZodError(updateValidator.error)
    })
  }

  const { id } = request.params;
  const { tarefa, descricao, status } = request.body;

  // validações
  if (!tarefa) {
    response.status(400).json({ message: "A tarefa é obrigatória" });
    return;
  }
  if (!status) {
    response.status(400).json({ message: "O status é obrigatória" });
    return;
  }

  const tarefaAtualizada = {
    tarefa,
    descricao,
    status,
  };

  try {
    const [linhasAfetadas] = await Tarefa.update(tarefaAtualizada, {
      where: { id },
    });

    if (linhasAfetadas <= 0) {
      response.status(404).json({ message: "Tarefa não encontrada" });
    }

    response.status(200).json({ message: "Tarefa Atualizada" });
  } catch (error) {
    response.status(500).json({ message: "Erro ao atualizar tarefa" });
  }
};

export const updateStatusTarefa = async (request, response) => {
  const { id } = request.params;

  try {
    const tarefa = await Tarefa.findOne({ raw: true, where: { id } });
    if (tarefa === null) {
      response.status(404).json({ message: "Tarefa não encontrada" });
      return;
    }

    if (tarefa.status === "pendente") {
      await Tarefa.update({ status: "concluida" }, { where: { id } });
    } else if (tarefa.status === "concluida") {
      await Tarefa.update({ status: "pendente" }, { where: { id } });
    }

    // novaConsulta
    const tarefaAtualizada = await Tarefa.findOne({ raw: true, where: { id } });
    response.status(200).json(tarefaAtualizada);
    // console.log(tarefa.status);
  } catch (error) {
    console.error(error);
    response.status(500).json({ err: "Error ao atualizar tarefa" });
  }
};

export const buscarTarefaPorSistuacao = async (request, response) => {
  const { situacao } = request.params;

  if (situacao !== "pendente" && situacao !== "concluida") {
    response
      .status(400)
      .json({ message: "Situação inválida. Use 'pendente' ou 'concluida'" });
    return;
  }

  try {
    const tarefas = await Tarefa.findAll({
      where: { status: situacao },
      raw: true,
    });
    response.status(200).json(tarefas);
  } catch (error) {
    response.status(500).json({ err: "Erro ao buscar tarefas " });
  }
};
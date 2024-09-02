import { request, response } from "express";
import Tarefa from "../models/tarefaModel.js";

// export const getAll = async (request, response) => {
//   try {
//     const tarefas = await Tarefa.findAll();
//     response.status(200).json(tarefas);
//   } catch (error) {
//     response.status(500).json({ message: "Erro ao listar tarefas" });
//   }
// };

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
export const create = async (request, response) => {
  const { tarefa, descricao } = request.body;
  const status = "pendente";
  if (!tarefa) {
    response.status(404).json({ err: "A tarefa é obrigatória" });
  }
  if (!descricao) {
    response.status(404).json({ err: "A descrição é obrigatória" });
  }
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

export const getTarefa = async (request, response) => {
  const { id } = request.params;
  try {
    const tarefaId = await Tarefa.findOne({ where: { id } });
    if (Tarefa === null) {
      response.status(404).json({ message: "Tarefa não encontrada" })
      return
    }

    response.status(200).json(tarefaId);
  } catch (error) {
    response.status(500).json({ err: "Erro ao buscar tarefa por id" });
    return
  }
};
export const updateTarefa = async (request, response) => {
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


    const [linhasAfetadas] = await Tarefa.update(tarefaAtualizada, { where: { id } });

    if (linhasAfetadas <= 0) {
      response.status(404).json({ message: "Tarefa não encontrada" })
    }

    response.status(200).json({ message: "Tarefa Atualizada" })
  } catch (error) {
    response.status(500).json({ message: "Errp ao atualizar tarefa" })
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
      await Tarefa.update({ status: "concluida" }, { where: { id } })

    } else if (tarefa.status === "concluida") {
      await Tarefa.update({ status: "pendente" }, { where: { id } })
    }

    const tarefaAtualizada = await Tarefa.findOne({ raw: true, where: { id } })
    response.status(200).json(tarefaAtualizada)
  } catch (error) {
    console.log(error)
    response.status(500).json({ err: "Erro ao atualizar tarefa" });
    return;
  }
}

export const getTarefaPorSituacao = async (request, response) => {
  const { situacao } = request.params;
  if (situacao !== "pendente" && situacao !== "concluido") {
    response.status(400).json({
      menssage: "Situação inválida. Use 'pendente' ou 'concluida'"
    })
    return
  }
  try {
    const tarefas = await Tarefa.findAll({
      where: { status: situacao },
      raw: true
    });

    response.status(200).json(tarefas)
  }catch(error){
    console.log(error)
    response.status(500).json({ err: "Erro ao Buscar Tarefa Por Situação" });
    return;
  }
}
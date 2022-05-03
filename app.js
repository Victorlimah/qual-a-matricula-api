import joi from "joi";
import cors from "cors";
import axios from "axios";
import express, { json } from "express";

const app = express();
app.use(json());
app.use(cors());

// talvez eu possa colocar isso no mongoDB
let cursos = [
  { nome: "SI", id: "1626837" },
  { nome: "LCC", id: "1626786" },
  { nome: "DESIGN", id: "1626836" },
  { nome: "MATEMATICA", id: "1626785" },
];

app.get("/matricula", async (req, res) => {
  const { curso, nome } = req.query;
  console.log(nome);

  if (!curso || !nome) return res.status(400).send("Faltam parâmetros");

  const validation = searchSchema.validate(req.query, { abortEarly: true });
  if (validation.error) return res.status(422).send("Erro de validação");

  let id = cursos.find((c) => c.nome === curso).id;

  // faz a requisição no sigaa da lista de alunos daquele curso
  axios
    .get(getURL(id))
    .then((response) => {
      // vai refatorar o codigo do sigaa e retornar um array de alunos com a matrícula
      let studentsArray = refactData(response.data);

      // vai filtrar aqueles alunos que tem em seu nome, aquilo que foi passado no input
      let student = studentsArray.filter((s) => s.nome.includes(nome));
      let messageErro = { message: "Esse estudante não existe no sistema" };

      if (student) res.status(200).send(student);
      else res.status(404).send(messageErro);
    })
    .catch((err) => res.send(err));
});

app.listen(5000, () => console.log("Servidor rodando na porta 5000."));

function getURL(idCurso) {
  return `https://sigaa.ufpb.br/sigaa/public/curso/alunos.jsf?lc=pt_BR&id=${idCurso}`;
}

function refactData(data) {
  const regexMatricula = /<td  class="colMatricula">(.*?)<\/td>/;
  const regexNome = /<td>(.*?)<\/td>/;

  let newStudentName = data.match(/<td>(.*?)<\/td>/g);
  let newStudentMat = data.match(/<td  class="colMatricula">(.*?)<\/td>/g);

  return newStudentName.map((student, index) => {
    return {
      matricula: newStudentMat[index].replace(regexMatricula, "$1"),
      nome: student.replace(regexNome, "$1"),
    };
  });
}

const searchSchema = joi.object({
  curso: joi.string().valid(...cursos.map((c) => c.nome)),
  nome: joi.string().required(),
});

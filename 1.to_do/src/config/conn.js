import {Sequelize} from "sequelize"


const conn = new Sequelize("todo3e", "root", "Sen@iDev77!.", {
    host: "localhost", 
    dialect: "mysql"
})
// Testando conexão com banco 
// try{
//     await conn.authenticate();
// console.log('Connection MYSQL')
// }catch{
// console.log("Error:" ,Error)
// }
export default conn; 
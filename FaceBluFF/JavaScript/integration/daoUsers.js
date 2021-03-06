class DAOUser{
	constructor(pool){
		this.pool = pool;
	}

	getUserData(id, callback){
	this.pool.getConnection(function(err, connection) {
		if (err) {
			callback(new Error("Error al obtener la conexion"), null);
		} else {
			connection.query(
				"SELECT email,id,name,gender,birthdate,image,points FROM users where id = ?",
				[id],
				(err, rows)=> {
				connection.release();
				if (err) {
					callback(new Error("Error al obtener los usuarios"), null)
				} else {
					callback(null, rows)
				}
			})
		}
	})
	}

	getUser(email, callback){
		this.pool.getConnection(function(err, connection) {
			if (err) {
				callback(new Error("Error al obtener la conexion"), null);
			} else {
				connection.query(
					"SELECT * FROM users where email = ?",
					[email],
					function(err, rows) {
					connection.release()
					if (err) {
						callback(new Error("Error al obtener los usuarios"), null)
					} else {
						callback(null, rows)
					}
				})
			}
		})
		}

	addUser(user,callback){
		this.pool.getConnection((err,connection)=>{
		
		if(err) callback(new Error("Error al obtener la conexion"));

		else
			connection.query("insert into users (email,password,name,gender,birthdate,image) values (?,?,?,?,?,?)",
			[user.email,user.password,user.name,user.gender,user.birthdate,user.image],(err,info)=>{
				
				connection.release();

				if(err) callback(new Error("El email ya esta registrado"), null);
				else{
					user.id = info.insertId;
					callback(null, user.id);
				}
			});
	})
	}

	findByName(name,currentUserId,callback){
		this.pool.getConnection((err,connection)=>{

		if(err) callback(new Error("Error al obtener la conexion"), null);

		else
			connection.query("select name,email,id,status,points from users left join (select * from friendrequests where originUser = ? or destinationUser= ?) as req on (id=req.destinationUser or id=req.originuser) where id != ? and name like ?;",
			[currentUserId,currentUserId,currentUserId,name+"%"],(err,result)=>{
				
				connection.release();

				if(err) callback(new Error("Error al obtener usuarios por nombre"),null);
				else{
					callback(null,result);
				}
			})
	})
	}

	sendFriendRequest(originUserId,destinationUserId,callback){
		this.pool.getConnection((err,connection)=>{

			if (err) callback(new Error("Error al obtener la conexion"));

			else 		//status -> 0=sin responder, 1=aceptada, 2=rechazada
			connection.query("insert into friendRequests (originUser,destinationUser,status) values (?,?,0) on duplicate key update status = (status = 1)",
			[originUserId,destinationUserId],(err)=>{
				
				connection.release();

				if (err) callback(new Error("Error al enviar solicitud"));
				else callback(null);
			});
		})
	}

	//utilizo el id porque el mail se puede modificar
	modifyUser(userId,newUser,callback){
		this.pool.getConnection((err,connection)=>{

			if (err) callback(new Error("Error al obtener la conexion"));
			else
				if (newUser.password != ""){
					connection.query(
						"update users set email = ?,password = ?,name = ?,gender = ?,birthdate = ?,image = ? where id = ?",
						[newUser.email,newUser.password,newUser.name,newUser.gender,newUser.birthdate,newUser.image, userId],
						(err)=>{
		
							connection.release();
							
							if (err) callback(new Error("El email ya esta registrado"));
							else callback(null);
						}
					)
				} else {
					connection.query(
						"update users set email = ?,name = ?,gender = ?,birthdate = ?,image = ? where id = ?",
						[newUser.email,newUser.name,newUser.gender,newUser.birthdate,newUser.image, userId],
						(err)=>{
		
							connection.release();
							
							if (err) callback(new Error("El email ya esta registrado"));
							else callback(null);
						}
					)
				}
				
		})
	}

	getPendingFriendRequest(userId,callback){
		this.pool.getConnection((err,connection)=>{
			
			if (err) callback(new Error("Error al obtener la conexion"));
			else
				connection.query("select id,name,email from users,friendrequests where status = 0 and destinationUser = ? and id = originUser",[userId],
				(err,result)=>{

					connection.release();

					if(err) callback(new Error("Error al obtener peticiones pendientes"),null);
					else callback(null, result);

				})
		})
	}

	confirmRequest(originUserId,destinationUserId,accept,callback){
		this.pool.getConnection((err,connection)=>{

			if (err) callback(new Error("Error al obtener la conexion"));
			else{
				let status;
				if (accept) status = 1;
				else status = 2;

				connection.query("UPDATE friendrequests SET status = ? WHERE destinationUser = ? and originUser = ?;",[status,destinationUserId,originUserId],
				(err)=>{

					connection.release();

					if(err) callback(new Error("Error al confirmar peticion"));
					else callback(null);
				});
			}
		})
	}
	getFriends(userId,callback){
		this.pool.getConnection((err,connection)=>{
			
			if (err) callback(new Error("Error al obtener la conexion"));
			else
				connection.query("SELECT u.* FROM users u LEFT JOIN friendrequests f on u.id = f.destinationUser or u.id=f.originUser WHERE f.status = 1 and (f.destinationUser = ? or f.originUser = ?)",[userId,userId],
				(err,result)=>{

					connection.release();

					if(err) callback(new Error("Error al obtener amigos"),null);
					else{

						//Para evitar que el propio usuario salga como su amigo
						let friends = [];
						
						result.forEach(element => {
							if(element.id != userId){
								friends.push(element);
							}					
						});
						 callback(null, friends);
					}

				})
		})
	}

	getUserImage(email, callback){
		this.pool.getConnection(function(err, connection) {
			if (err) {
				callback(new Error("Error al obtener la conexion"), null);
			} else {
				connection.query(
					"SELECT image FROM users where email = ?",
					[email],
					function(err, rows) {
					connection.release()
					if (err) {
						callback(new Error("Error al obtener los usuarios"), null)
					} else {
						callback(null, rows)
					}
				})
			}
		})
	}
}

module.exports = DAOUser;






const url = require('url');
const queryString = require('query-string');

const Storage = require('../storage/storage');
const Helper = require('./helper');
const Book = require('../model/book');

const storage = new Storage();

class BookController{

	static get(request, response){
		const {pathname} = url.parse(request.url);
		const bookID = Helper.idFromURI(pathname);
		return storage.find(bookID);
	}

	static index(request, response){
		return storage.books;
	}

	static update(request,response){
		let body = '';
		let post;
		//When the "data" event of the request is triggered, we add the data to our body.
		request.on('data', function (data) {
		    body += data;
		});

		request.on('end', function () {
			//Parse an object from the query
		    	post = queryString.parse(body);
			const {pathname} = url.parse(request.url);
			const newBook = new Book(post.title, post.author);
			//Get the last part of the URI, which is the ID
			const bookID = Helper.idFromURI(pathname);
			storage.update(bookID, newBook);
		});
	}

	static create(request,response){
		let body = '';
		let post;

		request.on('data', function (data) {
		    body += data;
		});

		request.on('end', function () {
		    	post = queryString.parse(body);
			const newBook = new Book(post.title, post.author);
			storage.create(newBook);
		});
	}

	static delete(request, response){
		const {pathname} = url.parse(request.url);
		const bookID = Helper.idFromURI(pathname);
		storage.delete(bookID);
	}
}

module.exports = BookController;

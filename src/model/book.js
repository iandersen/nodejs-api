class Book {
	constructor(title, author, id){
		this._title = title;
		this._author = author;
		this._id = id;
	}
	
	isBook(){
		return true;
	}

	get title(){
		return this._title;
	}

	set title(str){
		this._title = str;
	}

	get author(){
		return this._author;
	}

	set author(str){
		this._author = str;
	}

	get id(){
		return this._id;
	}

	set id(int){
		this._id = int;
	}
}

module.exports = Book;
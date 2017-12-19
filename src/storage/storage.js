/*
*
* This class's methods would interact with a database in a full version.
*
*/

import books from './books.json';

let instance = null;

class Storage{
	constructor(){
		//We only want one instance (Singleton) of the Storage class. If another storage exists, then we will return that.
		if(!instance){
			instance = this;
			this.books = books;
		}
		return instance;
	}
	//This would be replaced by a SELECT statement in SQL
	find(id){
		const book = this.books.filter((book) => {
			return book.id == id;
		});
		return book ? book[0] : {};
	}

	update(id, newBook){
		const updated = this.books.map((book, i) => {
			if(book.id == id){
				//If no title or author is passed, instead of setting them to null, we use ||, 
				//the null coalescing operator, to avoid erasing them..
				this.books[i].title = newBook.title || this.books[i].title;
				this.books[i].author = newBook.author || this.books[i].author;
				return true;
			}
		});
		return updated ? "Book updated" : "No book found with ID: " + id;
	}

	create(newBook){
		//The ID for a new book is set based off the last ID in storage
		//In SQL this would be an auto-incrementing key.
		const id = this.books[this.books.length - 1].id + 1;
		newBook.id = id;
		this.books.push(newBook);
	}

	delete(id){
		this.books.map((book, i) => {
			if(book.id == id)
				this.books.splice(i, 1);
		});
	}
}

export default Storage;


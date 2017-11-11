# nodejs-api
*For evaluation*

I spent around 6 hours on this program, 3 or so of which were initial setup.

This was my first time creating a NodeJS server or using BasicAuth, so a lot of information was gathered from the internet.

## To run:
Clone the repository, then type `npm run start`


## Commands to test:

### CREATE:
    curl -u myName:12345 -X POST -d title=Book -d author=Author localhost:8080/api/books
### READ:
#### All books:
    curl localhost:8080/api/books
#### Specific book:
    curl localhost:8080/api/books/1
### UPDATE:
    curl -u myName:12345 -X PATCH -d title=New -d author=New localhost:8080/api/books/1
### DELETE:
    curl -u myName:12345 -X DELETE localhost:8080/api/books/1


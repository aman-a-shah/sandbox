Fishbase API

https://ropensci.github.io/fishbaseapidocs/

HTTP methods
This is essentially a read only API. That is, we only allow GET (and HEAD) requests on this API.

Requests of all other types will be rejected with appropriate 405 code, including POST, PUT, COPY, HEAD, DELETE, etc.

Root
GET [/]

GET https://fishbase.ropensci.org

Redirects to https://fishbase.ropensci.org/heartbeat

 Note that when using curl you need to use the -L flag to follow redirects.
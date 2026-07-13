# ROLE
You are an expert in the creation of e-commerce stores.

## MAIN TASK
Your task is to create all the frontend of an e-commerce store, the client side and the admin side, so the admin can add new
merchantise to the clients, and the clients be able to see all the new merche and new things.

# REFERENCES
For reference take the popular e-commerce github repository: https://github.com/evershopcommerce/evershop.git.
This github repository contains the admin and client site of a normal e-commerce store, you must follow the style and structure of
this repo.

# RULES
- Only frontend, do not create api endpoint or anything like that, we are gonna make the api after the frontend is ready.
- The route /admin/create was created before building the whole e-commerce, join this route to the admin panel, so the admin can
create new designs and add them to a collection so the clients can see the new merchantise.
- The admin and client must share the same login page, and the register page is gonna be specialy for the client, in the future i will
create the admin profile directly on the database is gonna be connected to.
- If the project needs images, only use the formats (image/webp, image/svg), so the project can be very light and fast for the client
when the build is done.

## TECH STACK
### THE CURRENT PROJECT HAS BEEN CREATED WITH NEXTJS
- Only use arrow functions on the react code, do not use normal functions, only use arrow functions with its default export on each
file.
- Only use tailwindcss, do not use plain css configuration if it is not necessary.

## EXTERNAL TOOLS (FUTURE INTEGRATIONS)
- In the future, i am planning to use postgres on an aws service, and many other aws things so i can add this e-commerce to my
portfolio and say all the technologies i am planning to use.

## ADMIN PANEL
You must add a dashboard related to an e-commerce from an admin view, also create the pages so the admin can create new merchantise,
group it, for example, when the admin creates a new merche, he can choose what group is gonna be, sweater, hoodie, etc. And also
can choose what stack is gonna be, remember that this e-commerce is gonna be focused on tech clothing, for exmaple, a t-shirt with
a python logo in the front of it, or a hoddie with a rust icon and something behind the hoddie, so the admin can choose the clothe
type and the stack of that, example, frontend, backend, ai/ml, devops, etc.

## CLIENT SIDE
The client side must be minimal, but very intuitive, it must have the catalog of the clothes, the user must be able to filter the
clothes by its type, its category, price, etc.
In every item of the store, the user must be able to see the photos of the merche, its sizes, all the normal things on an online
store.

## WHAT NOT TO-DO
- Do not create a backend side, endpoints or scheme structure, that is gonna be done on the future.
- Do not add comments on the code, i like the code without comments, but if a folder contains many folders or files, you must create
a README.md file on that folder to explain the structure of that folder.

## FEEDBACK
If you have any questions before starting the project, you must ask before starting the code.

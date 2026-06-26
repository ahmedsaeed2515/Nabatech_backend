import swaggerJSDoc from 'swagger-jsdoc';


const options = {
  definition: {
    openapi: '3.0.0',
                    info: {
                    title: 'Express API with Swagger',
                    version: '1.0.0',
                    description: 'A simple Express API application documented with Swagger',
                    },
                    servers: [
                    {                   
                    url: 'http://localhost:10000',
                    },
                    ],
                },
                apis: ['./src/routers/*.ts'],
            };


const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;



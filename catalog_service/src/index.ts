import app from "./server";

const port = process.env.PORT || 8000;

export const StartServer = async() => {
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });

    process.on('unhandledRejection', (reason, promise) => {
        console.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
    })

    process.on('uncaughtException', (error) => {
        console.error(`Uncaught Exception thrown: ${error}`);
        process.exit(1);
    });
}

StartServer().then(() => {
    console.log('Server started successfully');
})
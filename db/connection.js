const { connect, disconnect } = require('mongoose');

exports.connectToDatabase = async () => {
    try {
        await connect(process.env.MONGODB_URL);
    } catch (error) {
        console.log(`error from connecting mongodb: ${error}`);
        throw new Error("Connection unsuccessful!");
    }
}

exports.disconnectFromDatabase = async () => {
    try {
        await disconnect();
    } catch (error) {
        console.log(`error from diconnecting from mongodb: ${error}`);
        throw new Error("Disconnection unsuccessful!");
    }
}
import { consoleTransport, logger } from 'react-native-logs';

var log = logger.createLogger({
    levels: {
        debug: 0,
        info: 1,
        warn: 2,
        error: 3,
    },
    severity: __DEV__ ? 'debug' : 'none',
    transport: consoleTransport,
    transportOptions: {
        colors: {
            info: "greenBright",
            warn: "yellowBright",
            error: "redBright",
        },
    },
    async: true,
    dateFormat: "time",
    printLevel: true,
    printDate: true,
    fixedExtLvlLength: false,
    enabled: true,
});
export default log;

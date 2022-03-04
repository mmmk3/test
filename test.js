const arrOfFields = ["name", "serviceCode", "targetCode", "creator", "orgShortName", "status", "lastUpdater", "lastUpdateDate"];
const arrOfDirection = ["asc", "desc"];

// сбрасывает значение у заполняемых в скрипте переменных
const arrOfEnv = ["service_with_version", "version_of_service"]
for(a = 0; a < arrOfEnv.length; ++a) {
    pm.environment.set(arrOfEnv[a], "")
}

// получает список услуг
url = pm.environment.get("server") + '/service-lib/internal/api/v1/services/info';
echoPostRequest = {
    url: url,
    method: 'POST',
    header: {
        'cookie': 'acc_t=' + pm.environment.get("acc_t"),
        'Content-Type': 'application/json'
    },
    body: {
        mode: 'raw',
        raw: JSON.stringify(JSON.parse('{"sort":[{"field":"' + arrOfFields[Math.floor(Math.random() * arrOfFields.length)] + '","direction":"' + arrOfDirection[Math.floor(Math.random() * arrOfDirection.length)] + '"}]}'))
    }
};

function sendRequest(req) {
    return new Promise((resolve, reject) => {
        pm.sendRequest(req, (err, res) => {
            if (err) {
                return reject(err);
            }
            respDetailsOfService = JSON.parse(JSON.stringify(res.json()));
            return resolve(res);
        });
    });
}

function sendRequest1(req) {
    return new Promise((resolve, reject) => {
        pm.sendRequest(req, (err, res) => {
            if (err) {
                return reject(err);
            }
            respDetailsOfVersion = JSON.parse(JSON.stringify(res.json()));
            return resolve(res);
        });
    });
}

pm.sendRequest(echoPostRequest, function (err, res) {
    respAllServices = JSON.parse(JSON.stringify(res.json()));

    if (res.code == 200) {

        const _dummy = setInterval(() => { }, 30000);

        (async function main() {

            for (i = 0; i < respAllServices.items.length; ++i) {
                // проверка на сервис код и получение версий услуги
                if (respAllServices.items[i].serviceInfo.serviceCode.includes("100000") == false) {
                    url = pm.environment.get("server") + '/service-lib/internal/api/v1/service/' + respAllServices.items[i].serviceInfo.serviceCode + '/versions';
                    let echoPostRequest = {
                        url: url,
                        method: 'GET',
                        header: {
                            'cookie': 'acc_t=' + pm.environment.get("acc_t"),
                            'Content-Type': 'application/json'
                        }
                    };
                    await sendRequest(echoPostRequest);

                    let arrOfServices = JSON.parse(pm.environment.get("arr_services"));

                    // проверка что есть версии и что версия не состоит в arrOfServices
                    if (respDetailsOfService.length > 0 && arrOfServices.indexOf(JSON.parse(respAllServices.items[i].serviceInfo.serviceCode)) == -1 == true) {
                        for (j = 0; j < respDetailsOfService.length; ++j) {
                            // проверяет, что фамилия автора версии = указанной в переменной(а лучше брать из запроса на юзера TODO)
                            if (respDetailsOfService[j].serviceVersionInfo.creator.lastName == pm.environment.get("acc_lastName")) {

                                // запрашивает конкретную версию, которая подошла по условиям
                                url1 = pm.environment.get("server") + '/service-lib/internal/api/v1/service/' + respAllServices.items[i].serviceInfo.serviceCode + '/version/' + respDetailsOfService[j].serviceVersionInfo.version;
                                let echoPostRequest1 = {
                                    url: url1,
                                    method: 'GET',
                                    header: {
                                        'cookie': 'acc_t=' + pm.environment.get("acc_t"),
                                        'Content-Type': 'application/json'
                                    }
                                };

                                await sendRequest1(echoPostRequest1);
                                // если нет комментов, то оставляет коммент и заполняет в переменные значения сервис кода и версии
                                if (respDetailsOfVersion.serviceVersion.comments.length === 0) {
                                    pm.environment.set("service_with_version", respAllServices.items[i].serviceInfo.serviceCode);
                                    pm.environment.set("version_of_service", respDetailsOfService[j].serviceVersionInfo.version);
                                    let someComment = "";
                                    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
                                    for (i = 0; i < Math.floor(Math.random() * 16) + 3; i++) {
                                    someComment += characters.charAt(Math.floor(Math.random() * characters.length));
                                    }
                                    pm.environment.set("some_comment", someComment);
                                    i = respAllServices.items.length + 1;
                                    break;
                                }
                            }
                        }
                    }
                }
            }
            clearInterval(_dummy);
        })()
    }
});

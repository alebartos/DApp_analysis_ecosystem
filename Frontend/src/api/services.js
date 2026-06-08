import axios from "axios";
const serverUrl = "http://localhost:8000";

/*export const _sendData = async (contractName, contractAddress, impl_contract, fromBlock, toBlock, network, sc, filters, extractionType) => {
    const formData = new FormData()
    formData.append('file', sc)
    formData.append('contractAddress', contractAddress)
    formData.append('implementationContractAddress', impl_contract)
    formData.append('contractName', contractName)
    formData.append('fromBlock', fromBlock)
    formData.append('toBlock', toBlock)
    formData.append('network', network)
    formData.append('filters', JSON.stringify(filters))
    formData.append('extractionType',extractionType);
    try {
        const response = await axios.post(serverUrl + "/submit", formData)
        return {status: response.status, data: response.data}
    } catch (error) {
        console.error(error)
        return {status: error.response.status, data: error.response.data}
    }
}

export const _sendDataInternal = async (contractAddressesFrom, contractAddressesTo, fromBlock, toBlock, network, sc, filters) => {
    const formData = new FormData()
    formData.append('file', sc)
    formData.append('contractAddressesFrom', JSON.stringify(contractAddressesFrom))
    formData.append('contractAddressesTo', JSON.stringify(contractAddressesTo))
    formData.append('fromBlock', fromBlock)
    formData.append('toBlock', toBlock)
    formData.append('network', network)
    formData.append('filters', JSON.stringify(filters))
    try {
        const response = await axios.post(serverUrl + "/submitInternal", formData)
        return {status: response.status, data: response.data}
    } catch (error) {
        console.error(error)
        return {status: error.response.status, data: error.response.data}
    }
}*/

export const _sendData = async ({ oldParams, newParams }) => {
    const formData = new FormData();
    if (oldParams) {
        formData.append('file', oldParams.smartContract);
        formData.append('contractAddress', oldParams.contractAddress);
        formData.append('implementationContractAddress', oldParams.impl_contract);
        formData.append('contractName', oldParams.contractName);
        formData.append('fromBlock', oldParams.fromBlock);
        formData.append('toBlock', oldParams.toBlock);
        formData.append('network', oldParams.network);
        formData.append('filters', JSON.stringify(oldParams.filters));
        formData.append('extractionType', oldParams.parameterForExtraction);
    } else if (newParams) {
        formData.append('file', newParams.smartContract);
        formData.append('contractAddressesFrom', JSON.stringify(newParams.contractAddressesFrom));
        formData.append('contractAddressesTo', JSON.stringify(newParams.contractAddressesTo));
        formData.append('fromBlock', newParams.fromBlock);
        formData.append('toBlock', newParams.toBlock);
        formData.append('network', newParams.network);
        formData.append('filters', JSON.stringify(newParams.filters));
        formData.append('extractionType', newParams.parameterForExtraction);
    } else {
        throw new Error("No parameters are given");
    }
    try {
        const response = await axios.post(serverUrl + "/submit", formData);
        return { status: response.status, data: response.data };
    } catch (error) {
        console.error(error);
        return { status: error?.response?.status, data: error?.response?.data };
    }
};


export const _downloadJson = async (jsonLog) => {
    const body = {
        jsonLog
    }

    try {
        const response = await axios.post(serverUrl + "/json-download", body, {responseType: 'blob'})
        return response.data
    } catch (error) {
        console.error(error)
    }
}

export const _downloadCSV = async (jsonLog) => {
    const body = {
        jsonLog
    }
    try {
        const response = await axios.post(serverUrl + "/csv-download", body, {responseType: 'blob'})
        return response.data
    } catch (error) {
        console.error(error)
    }
}

export const _xesDownload = async (jsonLog) => {
    const body = {
        jsonLog
    }
    try {
        const response = await axios.post(serverUrl + "/xes-translator", body, {responseType: 'blob'})
        return response.data
    } catch (error) {
        console.error(error)
    }
}

export const _downloadOCEL = async (ocel) => {
    const body = {
        ocel
    }
    try {
        const response = await axios.post(serverUrl + "/ocel-download", body, {responseType: 'blob'})
        return response.data
    } catch (error) {
        console.error(error)
    }
}

export const _downloadJSONOCEL = async (ocel) => {
    const body = {
        ocel
    }

    try {
        const response = await axios.post(serverUrl + "/jsonocel-download", body, {responseType: 'blob'})
        return response.data
    } catch (error) {
        console.error(error)
    }
}

export const _downloadCSVOCEL = async (ocel) => {
    const body = {
        ocel
    }

    try {
        const response = await axios.post(serverUrl + "/csvocel-download", body, {responseType: 'blob'})
        return response.data
    } catch (error) {
        console.error(error)
    }
}

export const _searchTransactionByQuery = async (query) => {
    try {
        const response = await axios.post(serverUrl + "/api/query", query)
        return {status: response.status, data: response.data}
    } catch (error) {
        console.error(error)
        return {status: error.response.status, data: error.response.data}
    }
}

export const _occelMapping = async (objectsToMap,blockchainLog) => {
    try {
        const response = await axios.post(serverUrl + "/api/ocelMap", {objectsToMap,blockchainLog})
        return {status: response.status, data: response.data}
    } catch (error) {
        console.error(error)
        return {status: error.response.status, data: error.response.data}
    }
}

export const _ocelXes = async (objectsToXes,jsonToXes)=>{
    try {
        const response = await axios.post(serverUrl + "/api/xes", {objectsToXes,jsonToXes})
        return {status: response.status, data: response.data}
    } catch (error) {
        console.error(error)
        return {status: error.response.status, data: error.response.data}
    }

}

export const _generateGraph=async (jsonData,edges)=>{
    try {
        const result=await axios.post(serverUrl + "/api/generateGraph", {jsonData,edges});
        return {status:200,data:result.data};
    } catch (error) {
        console.error(error)
        return {status: error.response.status, data: error.response.data}
    }
}

export const importJSONToDB = async(jsonLog)=>{
    try {
       const response = await axios.post(serverUrl + "/api/uploadDataInDb",{jsonLog})
       return {status: response.status};
    } catch (error) {
        console.error(error)
    }
}
function findAllValuesByKey(obj, key) {
    let results = [];

    function recursiveSearch(o) {
        if (typeof o !== 'object' || o === null) return;

        if (key in o) {
            results.push(o[key]);
        }

        for (let k in o) {
            if (typeof o[k] === 'object') {
                recursiveSearch(o[k]);
            } else if (Array.isArray(o[k])) {
                o[k].forEach(item => recursiveSearch(item));
            }
        }
    }

    recursiveSearch(obj);
    return results;

}

export const _ocelDetect = async (records) => {
    try {
        const response = await axios.post(serverUrl + "/api/ocel/detect", { records });
        return { status: response.status, data: response.data };
    } catch (error) {
        console.error(error);
        return { status: error?.response?.status, data: error?.response?.data };
    }
};

export const _ocelBuild = async (records, nestedColNames, objectTypeCols, activityCol, timestampCol) => {
    try {
        const response = await axios.post(serverUrl + "/api/ocel/build", {
            records, nestedColNames, objectTypeCols, activityCol, timestampCol
        });
        return { status: response.status, data: response.data };
    } catch (error) {
        console.error(error);
        return { status: error?.response?.status, data: error?.response?.data };
    }
};

export const _ocelE2OCombinations = async (sessionId) => {
    try {
        const response = await axios.post(serverUrl + "/api/ocel/e2o-combinations", { sessionId });
        return { status: response.status, data: response.data };
    } catch (error) {
        return { status: error?.response?.status, data: error?.response?.data };
    }
};

export const _ocelE2OQualifiers = async (sessionId, qualifierMap) => {
    try {
        const response = await axios.post(serverUrl + "/api/ocel/e2o-qualifiers", { sessionId, qualifierMap });
        return { status: response.status, data: response.data };
    } catch (error) {
        return { status: error?.response?.status, data: error?.response?.data };
    }
};

export const _ocelO2OEnrich = async (sessionId) => {
    try {
        const response = await axios.post(serverUrl + "/api/ocel/o2o-enrich", { sessionId });
        return { status: response.status, data: response.data };
    } catch (error) {
        return { status: error?.response?.status, data: error?.response?.data };
    }
};

export const _ocelO2OQualifiers = async (sessionId, qualifierMap) => {
    try {
        const response = await axios.post(serverUrl + "/api/ocel/o2o-qualifiers", { sessionId, qualifierMap });
        return { status: response.status, data: response.data };
    } catch (error) {
        return { status: error?.response?.status, data: error?.response?.data };
    }
};

export const _ocelGetSession = async (sessionId) => {
    try {
        const response = await axios.get(serverUrl + `/api/ocel/session/${sessionId}`);
        return { status: response.status, data: response.data };
    } catch (error) {
        return { status: error?.response?.status, data: error?.response?.data };
    }
};

export const _ocelDeleteSession = async (sessionId) => {
    try {
        await axios.delete(serverUrl + `/api/ocel/session/${sessionId}`);
    } catch (_) {}
};

export const _ocelExport = async (sessionId, format) => {
    try {
        const response = await axios.get(serverUrl + `/api/ocel/export/${sessionId}/${format}`, { responseType: 'blob' });
        return { status: response.status, data: response.data };
    } catch (error) {
        return { status: error?.response?.status, data: null };
    }
};

export const getData = async ({ type, query}) => {
  try {
    console.log("[Service] Fetching data with type:", type, "and query:", query);
    const response = await axios.post(`http://localhost:8000/api/data?type=${type}`, query);
    return {status: response.status, data: response.data}
  } catch (error) {
    console.error(error)
    return {status: error.response.status, data: error.response.data}
  }
}




import {useContext} from 'react';

import {DataContext} from "./DataContext";

function useDataContext() {
    const context = useContext(DataContext);

    return context;
}

export default useDataContext;
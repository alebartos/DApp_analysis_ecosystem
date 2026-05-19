import React, {useCallback, useMemo, useReducer} from 'react';

const initialState = {
    results: null,
    ocel: {
        eventTypes: [],
        objectTypes: [],
        events: [],
        objects: []
    },
    xes:null
}

const reducer = (state, action) => {
    switch (action.type) {
        case 'SET_RESULTS':
            return {
                ...state,
                results: action.payload
            }
        case 'SET_OCEL':
            return {
                ...state,
                ocel: action.payload
            }
        case 'SET_XES':
            return {
                ...state,
                xes: action.payload
            }
        default:
            return state
    }
}

export const DataContext = React.createContext(initialState);

function DataProvider(props) {

    const [state, dispatch] = useReducer(reducer, initialState)

    const setResults = useCallback((results) => {
        dispatch({type: 'SET_RESULTS', payload: results})
    },[])

    const setOcel = useCallback((ocel) => {
        dispatch({type: 'SET_OCEL', payload: ocel})
    }, [])
    
    const setXes = useCallback((xes) => {
        dispatch({type: 'SET_XES', payload: xes})
    }, [])

    const memorizedValue = useMemo(() => ({
        setResults,
        setOcel,
        setXes,
        xes: state.xes,
        results: state.results,
        ocel: state.ocel
    }), [state.results, state.ocel, state.xes, setXes, setResults, setOcel]);
    return (
        <DataContext.Provider value={memorizedValue}>
            {props.children}
        </DataContext.Provider>
    )
}

export default DataProvider;
import {
	createContext,
	useState,
	useCallback,
	useContext,
} from "react";

const DataViewContext = createContext();

export const DataViewProvider = ({ children }) => {
	const [data, setData] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [query, setQuery] = useState({});
	const [selectedTab, setSelectedTab] = useState(0);

	const setDataView = useCallback((newData) => {
		setData(newData);
	}, []);

	const setLoadingState = useCallback((isLoading) => {
		setLoading(isLoading);
	}, []);

	const setErrorState = useCallback((errorMessage) => {
		setError(errorMessage);
	}, []);

	const setQueryState = useCallback((newQuery) => {
		setQuery(newQuery);
	}, []);

	const setSelectedTabState = useCallback((newTab) => {
		setSelectedTab(newTab);
	}, []);

	const value = {
		data,
		loading,
		error,
		query,
		selectedTab,
		setQueryState,
		setLoadingState,
		setErrorState,
		setDataView,
		setSelectedTabState,
	};

	return (
		<DataViewContext.Provider value={value}>
			{children}
		</DataViewContext.Provider>
	);
};

export const useDataView = () => {
	const context = useContext(DataViewContext);
	if (!context) {
		throw new Error("useDataView must be used within a DataViewProvider");
	}
	return context;
};

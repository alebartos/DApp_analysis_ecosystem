import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { RouterProvider, createBrowserRouter } from 'react-router';
import BodyLayout from './layouts/BodyLayout';
import DataExtractionPage from './pages/DataExtraction';
import OcelMapping from './pages/OcelMapping';
import Query from './pages/Query';
import XesPage from './pages/XesPage';
import HomePage from './pages/HomePage';
import DataViewPage from './pages/DataView';
import NetworkGraph from './pages/VisualModel';
import DataExtractionInternalPage from './pages/DataExtractionInternal';
import CoBlocklyPage from './pages/CoBlockly/CoBlocklyPage';

const router = createBrowserRouter([
    {
        Component: App,
        children: [
            {
              Component: BodyLayout,
              children : [
                {
                  path: "/",
                  Component: HomePage
                },
                {
                  path: "data-extraction",
                  Component: DataExtractionPage
                },
                {
                  path: "data-extraction/extraction",
                  Component: DataExtractionPage
                },
                {
                  path: "data-extraction/extractionInternal",
                  Component: DataExtractionInternalPage
                },
                {
                  path: "data-analysis",
                  Component: DataViewPage
                },
                {
                  path: "data-analysis/view",
                  Component: DataViewPage
                },
                {
                  path: "data-mapping",
                  Component: OcelMapping
                },
                {
                  path: "data-mapping/ocel",
                  Component: OcelMapping
                },
                {
                  path: "data-analysis/query",
                  Component: Query
                },
                {
                  path: "data-mapping/xes",
                  Component: XesPage
                },
                {
                  path: "data-analysis/visual",
                  Component: NetworkGraph
                },
                {
                  path: "data-mapping/coblockly",
                  Component: CoBlocklyPage
                }
              ]
            },
        ]
    }
]);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

import React, {useEffect, useState} from 'react';
import {Box, Button, Stack, Typography} from "@mui/material";
import AddBoxIcon from '@mui/icons-material/AddBox';

import CustomTypography from "../components/CustomTypography";
import ObjectType from "../components/objectTypes/ObjectType";

import ActivityEventType from "../components/eventTypes/ActivityEventType";
import useDataContext from "../context/useDataContext";
import PageLayout from '../layouts/PageLayout';
import XesType from '../components/xesType/XesType';
import { _ocelXes } from '../api/services';


function XesPage() {

    const {results} = useDataContext();

    const [loading, setLoading] = useState(false)

    const [caseId, setCaseId] = useState([])

    const [activityKey, setActivityKey] = useState([])

    const [timestamp, setTimestamp] = useState([])

    const {setXes} = useDataContext()


    const sendObjectForXes = () => {
            setLoading(true)
            _ocelXes({caseId,activityKey,timestamp},results).then((response) => {
                // const xmlString =response.data.xesString;
                // const parser = new DOMParser();
                // const xmlDoc = parser.parseFromString(xmlString, "text/xml");
                // console.log(xmlDoc.documentElement);
                setXes(response.data)
                setLoading(false)
            }).then()
        }
    return (
        <PageLayout loading={loading}>
            <Box display="flex" justifyContent="center">
                <Box position="relative" height="100%" width={520} paddingBottom={2}>
                    <Typography variant="h3">
                        Selection form
                    </Typography>
                    <Stack marginY={3} height="calc(100vh - 300px)" overflow="auto">
                        <CustomTypography>
                            Case Id
                            <XesType name="case_id"
                            objectToSet={setCaseId}/>
                        </CustomTypography>
                        <CustomTypography>
                            activity key
                            <XesType name="activity_key"
                            objectToSet={setActivityKey}
                            />
                        </CustomTypography>
                        <CustomTypography>
                            timestamp
                            <XesType name="timestamp"
                            objectToSet={setTimestamp}
                            />
                        </CustomTypography>
                    </Stack>
                </Box>
            </Box>
            <Box display="flex" justifyContent="center">
                <Button  component="label" variant="contained" onClick={sendObjectForXes} sx={{padding: 1}}>
                    Create Xes file
                </Button>
            </Box>
        </PageLayout>
    )
}

export default XesPage;

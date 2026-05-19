import React, {useState} from 'react';
import {Box, Typography, IconButton} from "@mui/material";
import NestedField from './NestedField';
import {Delete} from '@mui/icons-material';
import AddQueryButton from "./AddQueryButton";

const EventsForm = ({events, setEvents}) => {
    const [showEvents, setShowEvents] = useState(false);

    const handleAddInput = () => {
        setShowEvents(true);
    };

    const handleEventsChange = (event) => {
        const {name, value} = event.target;
        setEvents({...events, [name]: value});
    };

    const handleDeleteEvents = () => {
        setEvents({eventName: ''});
        setShowEvents(false);
    };

    return (
        <Box>
            <Typography variant="h6">Events</Typography>
            {showEvents ? (
                <Box mb={2} display="flex" alignItems="center">
                    <Box flexGrow={1}>
                        <NestedField label="Event Name" name="eventName" value={events.eventName}
                                     onChange={handleEventsChange}/>
                    </Box>
                    <IconButton onClick={handleDeleteEvents} color="error">
                        <Delete/>
                    </IconButton>
                </Box>
            ) : (
                <AddQueryButton label="Add Event" onClick={handleAddInput}/>
            )}
        </Box>
    );
};

export default EventsForm;

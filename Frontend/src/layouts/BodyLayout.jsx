import React from 'react';
import {Box} from "@mui/material";
import { Outlet } from "react-router";
import { PageContainer } from '@toolpad/core/PageContainer';
import { DashboardLayout } from '@toolpad/core/DashboardLayout';

function BodyLayout() {
    return (
        <DashboardLayout>
            <PageContainer>
                <Outlet/>
            </PageContainer>
        </DashboardLayout>
    );
}

export default BodyLayout;

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import SetupNav from './SetupNav';
import Maps from './Maps/Maps';
import CreateMap from './Maps/CreateMap/CreateMap';
import EditMaps from './Maps/EditMaps/EditMaps';
import EditMapInfo from './Maps/EditMaps/EditMapInfo';
import ViewMap from './Maps/ViewMap/ViewMap';
import Missions from './Missions/Missions';
import CreateMission from './Missions/CreateMission';
import EditMission from './Missions/EditMission';
import MissionDetail from './Missions/MissionDetail';
import Footprints from './Footprints/Footprints';
import Sites from './Maps/CreateMap/Sites/Sites';
import CreateSite from './Maps/CreateMap/Sites/CreateSite';
import EditSite from './Maps/CreateMap/Sites/EditSite';
import Transitions from './Transitions/Transitions';
import CreateTransition from './Transitions/CreateTransition';
import EditTransition from './Transitions/EditTransition';
import Groups from './Missions/Groups';
import CreateGroup from './Missions/CreateGroup';
import EditGroup from './Missions/EditGroup';
import UserGroups from './UserGroups/UserGroups';
import EditUserGroup from './UserGroups/EditUserGroup';
import Users from './Users/Users';
import EditUser from './Users/EditUser';

import './Setup.css';
import Schedule from './Schedule';
import CreateSchedule from './Schedule/CreateSchedule';

// Placeholder components for each setup section
const Paths = () => <div>Paths Content</div>;
const PathGuides = () => <div>Path Guides Content</div>;

const Setup = ({ isNavOpen }) => {
  return (
    <div className={`setup-container ${isNavOpen ? "nav-expanded" : ""}`}>
      <SetupNav isNavOpen={isNavOpen} />
      <div className="setup-content">
        <Routes>
          <Route path="missions" element={<Missions />} />
          <Route path="missions/create" element={<CreateMission />} />
          <Route path="missions/edit/:id" element={<EditMission />} />
          <Route path="missions/detail/:id" element={<MissionDetail />} />
          <Route path="missions/groups" element={<Groups />} />
          <Route path="missions/groups/create" element={<CreateGroup />} />
          <Route path="missions/groups/edit/:id" element={<EditGroup />} />
          <Route path="maps" element={<Maps />} />
          <Route path="maps/create" element={<CreateMap />} />
          <Route path="maps/edit/:mapId" element={<EditMaps />} />
          <Route path="maps/edit/:mapId/info" element={<EditMapInfo />} />
          <Route path="maps/view/:mapId" element={<ViewMap />} />
          <Route path="footprints" element={<Footprints />} />
          <Route path="transitions" element={<Transitions />} />
          <Route path="transitions/create" element={<CreateTransition />} />
          <Route path="transitions/edit/:id" element={<EditTransition />} />
          <Route path="user-groups" element={<UserGroups />} />
          <Route path="user-groups/create" element={<EditUserGroup />} />
          <Route path="user-groups/edit/:id" element={<EditUserGroup />} />
          <Route path="users" element={<Users />} />
          <Route path="users/create" element={<EditUser />} />
          <Route path="users/edit/:id" element={<EditUser />} />
          <Route path="paths" element={<Paths />} />
          <Route path="path-guides" element={<PathGuides />} />
          <Route path="maps/create/sites" element={<Sites />} />
          <Route path="sites/create" element={<CreateSite />} />
          <Route path="sites/edit/:id" element={<EditSite />} />
          <Route path="schedule" element={<Schedule />} />
          <Route path="schedule/create" element={<CreateSchedule />} />
        </Routes>
      </div>
    </div>
  );
};

export default Setup; 
import dashboardIcon from '../../assets/icons/icons-dashboard-1.svg';
import userIcon from '../../assets/icons/icon-user-2.svg';
import graduationIcon from '../../assets/icons/icon-graduation-cap-1.svg';
import projectIcon from '../../assets/icons/icon-proyek.svg';
import workshopIcon from '../../assets/icons/icon-workshop-1.svg';
import contactIcon from '../../assets/icons/icon-kontak-1.svg';
import dollarIcon from '../../assets/icons/icon-dollar-1.svg';
import fileIcon from '../../assets/icons/icon-file-text-1.svg';
import cpuIcon from '../../assets/icons/icon-cpu-1.svg';
import settingsIcon from '../../assets/icons/icon-settings-1.svg';

const sidebarIconMap = {
  dashboard: dashboardIcon,
  user: userIcon,
  graduation: graduationIcon,
  folder: projectIcon,
  project: projectIcon,
  calendar: workshopIcon,
  workshop: workshopIcon,
  lead: contactIcon,
  partner: contactIcon,
  transaction: dollarIcon,
  certificate: fileIcon,
  cpu: cpuIcon,
  ide: cpuIcon,
  settings: settingsIcon,
};

export function DashboardUserSidebarIcon({ name }) {
  const src = sidebarIconMap[name] || dashboardIcon;

  return (
    <img
      className="dashboard-sidebar__asset-icon"
      src={src}
      alt=""
      aria-hidden="true"
    />
  );
}

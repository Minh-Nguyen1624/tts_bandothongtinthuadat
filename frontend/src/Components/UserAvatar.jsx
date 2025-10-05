import "../css/HomePage.css";

const UserAvatar = ({ name }) => (
  <div className="user-avatar">{name?.charAt(0)?.toUpperCase() || "U"}</div>
);

export default UserAvatar;

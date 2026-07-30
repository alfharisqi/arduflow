function getInitials(name) {
  return (name || 'Nama Lengkap')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export function ProfileAvatar({ className = '', image = '', name = 'Nama Lengkap', editable = false, onEdit }) {
  const content = image ? <img src={image} alt="" /> : <span>{getInitials(name)}</span>;
  const avatarClassName = `${className} profile-avatar${editable ? ' profile-avatar--editable' : ''}`.trim();

  if (editable) {
    return (
      <button className={avatarClassName} type="button" onClick={onEdit} aria-label="Edit foto profil">
        {content}
      </button>
    );
  }

  return (
    <div className={avatarClassName} aria-hidden="true">
      {content}
    </div>
  );
}

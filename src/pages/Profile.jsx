import { UserRound } from 'lucide-react';
import CreatorProfileForm from '../components/CreatorProfileForm';
import { DemoBadge, PageHeader } from '../components/ui';
import { useApp } from '../context/AppContext';
export default function Profile() {
  const { profile, saveProfile } = useApp();
  return <><PageHeader eyebrow="THE CONTEXT BEHIND EVERY IDEA" title="Creator Profile" description="A clear point of view makes for better research." /><div className="profile-intro glass"><span className="profile-avatar">{profile.name ? profile.name.slice(0,1).toUpperCase() : <UserRound size={27} />}</span><div><h2>{profile.name || 'Your creator profile'}</h2><p>{profile.niche || 'Choose your niche'} · {profile.platform}</p></div><DemoBadge>LOCAL PROFILE</DemoBadge></div><CreatorProfileForm initialValue={profile} onSave={saveProfile} /></>;
}

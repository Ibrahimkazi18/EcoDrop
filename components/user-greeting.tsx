import { useUser } from "@/hooks/use-user"; // Adjust the import path
import Spinner from "@/components/ui/spinner";; // Optional: a spinner for loading state

const UserProfile = () => {
  const { user, loading } = useUser();

  if (loading) {
    return <Spinner />; // Show a loading spinner or skeleton
  }

  return (
    <div>
      {user ? (
        <h1>Welcome, {user.username}!</h1> // Access username here
      ) : (
        <p>User not found</p>
      )}
    </div>
  );
};

export default UserProfile;

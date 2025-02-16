import { useUser } from "@/hooks/use-user"; 

const UserGreeting = () => {
  const { user, loading } = useUser();

  return (  
    <div>
      {user ? (
        <h1>Welcome, {user?.username}!</h1> 
      ) : (
        <p>Not Found</p>
      )}
    </div>
  );
};

export default UserGreeting;

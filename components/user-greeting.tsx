import { useUser } from "@/hooks/use-user"; 
import { auth } from "@/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";

const UserGreeting = () => {
  const { user, loading } = useUser();

  const [us, load, error] = useAuthState(auth);

  return (  
    <div>
      {user ? (
        <h1>Welcome, {user?.username}!</h1> 
      ) : (
        <p>Not Found</p>
      )}

      {us? (<p>{us.displayName}</p>) : (<p>no</p>)}
    </div>
  );
};

export default UserGreeting;

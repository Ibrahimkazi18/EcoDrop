import Spline from '@splinetool/react-spline/next';

export default function RewardSpline() {
  return (
    <div className='flex items-center justify-center min-h-screen'> 
      <div className='pointer-events-none w-[74rem]'> 
        <Spline
          scene="https://prod.spline.design/uP3PqxLYUjaBEwgP/scene.splinecode"
          className='rounded-xl' 
        />
      </div>
    </div>
  );
}

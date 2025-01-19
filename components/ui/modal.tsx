// components/ui/modal.tsx

import React, { ReactNode } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-gray-800 bg-opacity-50 z-50" onClick={onClose}></div>
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Assign Volunteers</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              &times;
            </button>
          </div>
          {children}
        </div>
      </div>
    </>
  );
};

export { Modal };

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ConfirmationModalProps {
  listing: any;
  onClose: () => void;
  onConfirm: (address: string, paymentOption: string) => void;
}

const ConfirmationModal = ({ listing, onClose, onConfirm }: ConfirmationModalProps) => {
  const [address, setAddress] = useState("");
  const [paymentOption, setPaymentOption] = useState("cash");

  const handleConfirm = () => {
    if (!address) {
      alert("Please enter your address.");
      return;
    }
    onConfirm(address, paymentOption);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Confirm Your Order</h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="address">Delivery Address</Label>
            <Input
              id="address"
              placeholder="Enter your address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="paymentOption">Payment Option</Label>
            <select
              id="paymentOption"
              value={paymentOption}
              onChange={(e) => setPaymentOption(e.target.value)}
              className="w-full p-2 border rounded-lg"
            >
              <option value="cash">Cash on Delivery</option>
              <option value="online">Online Payment on Delivery</option>
            </select>
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>Confirm Order</Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
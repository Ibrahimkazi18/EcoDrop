import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface ResellModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSell: (model: string, yearsOld: number, condition: string, address: string) => void;
}

const ResellModal = ({ isOpen, onClose, onSell }: ResellModalProps) => {
  const [model, setModel] = useState("");
  const [yearsOld, setYearsOld] = useState("");
  const [condition, setCondition] = useState("");
  const [address, setAddress] = useState("");
  const { toast } = useToast();

  const handleSell = () => {
    if (!model || !yearsOld || !condition) {
      toast({
        title: "Incomplete Details",
        description: "Please fill in all the fields.",
        variant: "destructive",
      });
      return;
    }

    onSell(model, parseInt(yearsOld), condition, address);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-20">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Resell Your Device</h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="model">Model</Label>
            <Input
              id="model"
              placeholder="e.g., iPhone 12, Samsung Galaxy S20"
              className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300"
              value={model}
              onChange={(e) => setModel(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="yearsOld">Years Old</Label>
            <Input
              id="yearsOld"
              type="number"
              className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300"
              placeholder="e.g., 2"
              value={yearsOld}
              onChange={(e) => setYearsOld(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="condition">Condition</Label>
            <Input
              id="condition"
              className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300"
              placeholder="e.g., good, fair, poor"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300"
              placeholder="Your address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSell}>Sell</Button>
        </div>
      </div>
    </div>
  );
};

export default ResellModal;
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Database, Edit2, Loader2, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  type Medicine,
  Unit,
  useAddMedicine,
  useDeleteMedicine,
  useGetMedicines,
  useUpdateMedicine,
} from "../hooks/useQueries";

const EMPTY_MED: Medicine = {
  id: 0n,
  name: "",
  genericName: "",
  manufacturer: "",
  batchNumber: "",
  expiryDate: "",
  currentStock: 0n,
  reorderLevel: 10n,
  sellingPrice: 0n,
  purchasePrice: 0n,
  gstPercent: 12n,
  unit: Unit.strip,
  hsnCode: "",
  rackLocation: "",
};

const COMMON_MEDICINES: Array<{
  name: string;
  genericName: string;
  manufacturer: string;
  unit: Unit;
  hsnCode: string;
  gstPercent: number;
}> = [
  {
    name: "Paracetamol 500mg",
    genericName: "Paracetamol",
    manufacturer: "GSK",
    unit: Unit.strip,
    hsnCode: "30049099",
    gstPercent: 12,
  },
  {
    name: "Paracetamol 650mg",
    genericName: "Paracetamol",
    manufacturer: "Cipla",
    unit: Unit.strip,
    hsnCode: "30049099",
    gstPercent: 12,
  },
  {
    name: "Dolo 650",
    genericName: "Paracetamol",
    manufacturer: "Micro Labs",
    unit: Unit.strip,
    hsnCode: "30049099",
    gstPercent: 12,
  },
  {
    name: "Crocin 500mg",
    genericName: "Paracetamol",
    manufacturer: "GSK",
    unit: Unit.strip,
    hsnCode: "30049099",
    gstPercent: 12,
  },
  {
    name: "Amoxicillin 250mg",
    genericName: "Amoxicillin",
    manufacturer: "Cipla",
    unit: Unit.strip,
    hsnCode: "30041010",
    gstPercent: 12,
  },
  {
    name: "Amoxicillin 500mg",
    genericName: "Amoxicillin",
    manufacturer: "Cipla",
    unit: Unit.strip,
    hsnCode: "30041010",
    gstPercent: 12,
  },
  {
    name: "Augmentin 625mg",
    genericName: "Amoxicillin + Clavulanate",
    manufacturer: "GSK",
    unit: Unit.strip,
    hsnCode: "30041010",
    gstPercent: 12,
  },
  {
    name: "Azithromycin 500mg",
    genericName: "Azithromycin",
    manufacturer: "Sun Pharma",
    unit: Unit.strip,
    hsnCode: "30041099",
    gstPercent: 12,
  },
  {
    name: "Cetirizine 10mg",
    genericName: "Cetirizine",
    manufacturer: "Cipla",
    unit: Unit.strip,
    hsnCode: "30049099",
    gstPercent: 12,
  },
  {
    name: "Levocetirizine 5mg",
    genericName: "Levocetirizine",
    manufacturer: "UCB",
    unit: Unit.strip,
    hsnCode: "30049099",
    gstPercent: 12,
  },
  {
    name: "Loratadine 10mg",
    genericName: "Loratadine",
    manufacturer: "Cipla",
    unit: Unit.strip,
    hsnCode: "30049099",
    gstPercent: 12,
  },
  {
    name: "Allegra 120mg",
    genericName: "Fexofenadine",
    manufacturer: "Sanofi",
    unit: Unit.strip,
    hsnCode: "30049099",
    gstPercent: 12,
  },
  {
    name: "Ibuprofen 400mg",
    genericName: "Ibuprofen",
    manufacturer: "Abbott",
    unit: Unit.strip,
    hsnCode: "30049099",
    gstPercent: 12,
  },
  {
    name: "Ibuprofen 600mg",
    genericName: "Ibuprofen",
    manufacturer: "Abbott",
    unit: Unit.strip,
    hsnCode: "30049099",
    gstPercent: 12,
  },
  {
    name: "Combiflam Tablet",
    genericName: "Ibuprofen + Paracetamol",
    manufacturer: "Sanofi",
    unit: Unit.strip,
    hsnCode: "30049099",
    gstPercent: 12,
  },
  {
    name: "Metformin 500mg",
    genericName: "Metformin",
    manufacturer: "Sun Pharma",
    unit: Unit.strip,
    hsnCode: "30049099",
    gstPercent: 12,
  },
  {
    name: "Metformin 1000mg",
    genericName: "Metformin",
    manufacturer: "Sun Pharma",
    unit: Unit.strip,
    hsnCode: "30049099",
    gstPercent: 12,
  },
  {
    name: "Glimepiride 1mg",
    genericName: "Glimepiride",
    manufacturer: "Sanofi",
    unit: Unit.strip,
    hsnCode: "30049099",
    gstPercent: 12,
  },
  {
    name: "Glimepiride 2mg",
    genericName: "Glimepiride",
    manufacturer: "Sanofi",
    unit: Unit.strip,
    hsnCode: "30049099",
    gstPercent: 12,
  },
  {
    name: "Voglibose 0.2mg",
    genericName: "Voglibose",
    manufacturer: "Novo Nordisk",
    unit: Unit.strip,
    hsnCode: "30049099",
    gstPercent: 12,
  },
  {
    name: "Atorvastatin 10mg",
    genericName: "Atorvastatin",
    manufacturer: "Ranbaxy",
    unit: Unit.strip,
    hsnCode: "30049099",
    gstPercent: 12,
  },
  {
    name: "Atorvastatin 20mg",
    genericName: "Atorvastatin",
    manufacturer: "Ranbaxy",
    unit: Unit.strip,
    hsnCode: "30049099",
    gstPercent: 12,
  },
  {
    name: "Rosuvastatin 10mg",
    genericName: "Rosuvastatin",
    manufacturer: "AstraZeneca",
    unit: Unit.strip,
    hsnCode: "30049099",
    gstPercent: 12,
  },
  {
    name: "Rosuvastatin 20mg",
    genericName: "Rosuvastatin",
    manufacturer: "AstraZeneca",
    unit: Unit.strip,
    hsnCode: "30049099",
    gstPercent: 12,
  },
  {
    name: "Amlodipine 5mg",
    genericName: "Amlodipine",
    manufacturer: "Cipla",
    unit: Unit.strip,
    hsnCode: "30049099",
    gstPercent: 12,
  },
  {
    name: "Amlodipine 10mg",
    genericName: "Amlodipine",
    manufacturer: "Cipla",
    unit: Unit.strip,
    hsnCode: "30049099",
    gstPercent: 12,
  },
  {
    name: "Losartan 50mg",
    genericName: "Losartan",
    manufacturer: "Lupin",
    unit: Unit.strip,
    hsnCode: "30049099",
    gstPercent: 12,
  },
  {
    name: "Telmisartan 40mg",
    genericName: "Telmisartan",
    manufacturer: "Glenmark",
    unit: Unit.strip,
    hsnCode: "30049099",
    gstPercent: 12,
  },
  {
    name: "Telmisartan 80mg",
    genericName: "Telmisartan",
    manufacturer: "Glenmark",
    unit: Unit.strip,
    hsnCode: "30049099",
    gstPercent: 12,
  },
  {
    name: "Metoprolol 25mg",
    genericName: "Metoprolol",
    manufacturer: "AstraZeneca",
    unit: Unit.strip,
    hsnCode: "30049099",
    gstPercent: 12,
  },
  {
    name: "Metoprolol 50mg",
    genericName: "Metoprolol",
    manufacturer: "AstraZeneca",
    unit: Unit.strip,
    hsnCode: "30049099",
    gstPercent: 12,
  },
  {
    name: "Atenolol 50mg",
    genericName: "Atenolol",
    manufacturer: "Cipla",
    unit: Unit.strip,
    hsnCode: "30049099",
    gstPercent: 12,
  },
  {
    name: "Aspirin 75mg",
    genericName: "Aspirin",
    manufacturer: "Bayer",
    unit: Unit.strip,
    hsnCode: "30049099",
    gstPercent: 12,
  },
  {
    name: "Aspirin 150mg",
    genericName: "Aspirin",
    manufacturer: "Bayer",
    unit: Unit.strip,
    hsnCode: "30049099",
    gstPercent: 12,
  },
  {
    name: "Clopidogrel 75mg",
    genericName: "Clopidogrel",
    manufacturer: "Sun Pharma",
    unit: Unit.strip,
    hsnCode: "30049099",
    gstPercent: 12,
  },
  {
    name: "Omeprazole 20mg",
    genericName: "Omeprazole",
    manufacturer: "Dr. Reddy's",
    unit: Unit.strip,
    hsnCode: "30049099",
    gstPercent: 12,
  },
  {
    name: "Omeprazole 40mg",
    genericName: "Omeprazole",
    manufacturer: "Dr. Reddy's",
    unit: Unit.strip,
    hsnCode: "30049099",
    gstPercent: 12,
  },
  {
    name: "Pantoprazole 40mg",
    genericName: "Pantoprazole",
    manufacturer: "Sun Pharma",
    unit: Unit.strip,
    hsnCode: "30049099",
    gstPercent: 12,
  },
  {
    name: "Pan 40mg",
    genericName: "Pantoprazole",
    manufacturer: "Alkem",
    unit: Unit.strip,
    hsnCode: "30049099",
    gstPercent: 12,
  },
  {
    name: "Pantop-D Capsule",
    genericName: "Pantoprazole + Domperidone",
    manufacturer: "Sun Pharma",
    unit: Unit.strip,
    hsnCode: "30049099",
    gstPercent: 12,
  },
  {
    name: "Rabeprazole 20mg",
    genericName: "Rabeprazole",
    manufacturer: "Cipla",
    unit: Unit.strip,
    hsnCode: "30049099",
    gstPercent: 12,
  },
  {
    name: "Ranitidine 150mg",
    genericName: "Ranitidine",
    manufacturer: "GSK",
    unit: Unit.strip,
    hsnCode: "30049099",
    gstPercent: 12,
  },
  {
    name: "Domperidone 10mg",
    genericName: "Domperidone",
    manufacturer: "Cipla",
    unit: Unit.strip,
    hsnCode: "30049099",
    gstPercent: 12,
  },
  {
    name: "Ondansetron 4mg",
    genericName: "Ondansetron",
    manufacturer: "Sun Pharma",
    unit: Unit.strip,
    hsnCode: "30049099",
    gstPercent: 12,
  },
  {
    name: "Ondansetron 8mg",
    genericName: "Ondansetron",
    manufacturer: "Sun Pharma",
    unit: Unit.strip,
    hsnCode: "30049099",
    gstPercent: 12,
  },
  {
    name: "Digene Antacid",
    genericName: "Aluminium Hydroxide",
    manufacturer: "Abbott",
    unit: Unit.bottle,
    hsnCode: "30049099",
    gstPercent: 12,
  },
  {
    name: "Eno Sachet",
    genericName: "Sodium Bicarbonate",
    manufacturer: "GSK",
    unit: Unit.strip,
    hsnCode: "30049099",
    gstPercent: 5,
  },
  {
    name: "Levothyroxine 25mcg",
    genericName: "Levothyroxine",
    manufacturer: "Abbott",
    unit: Unit.strip,
    hsnCode: "30049099",
    gstPercent: 12,
  },
  {
    name: "Levothyroxine 50mcg",
    genericName: "Levothyroxine",
    manufacturer: "Abbott",
    unit: Unit.strip,
    hsnCode: "30049099",
    gstPercent: 12,
  },
  {
    name: "Levothyroxine 100mcg",
    genericName: "Levothyroxine",
    manufacturer: "Abbott",
    unit: Unit.strip,
    hsnCode: "30049099",
    gstPercent: 12,
  },
  {
    name: "Furosemide 40mg",
    genericName: "Furosemide",
    manufacturer: "Sanofi",
    unit: Unit.strip,
    hsnCode: "30049099",
    gstPercent: 12,
  },
  {
    name: "Spironolactone 25mg",
    genericName: "Spironolactone",
    manufacturer: "Pfizer",
    unit: Unit.strip,
    hsnCode: "30049099",
    gstPercent: 12,
  },
  {
    name: "Hydrochlorothiazide 25mg",
    genericName: "Hydrochlorothiazide",
    manufacturer: "Cipla",
    unit: Unit.strip,
    hsnCode: "30049099",
    gstPercent: 12,
  },
  {
    name: "Prednisolone 5mg",
    genericName: "Prednisolone",
    manufacturer: "Pfizer",
    unit: Unit.strip,
    hsnCode: "30049099",
    gstPercent: 12,
  },
  {
    name: "Prednisolone 10mg",
    genericName: "Prednisolone",
    manufacturer: "Pfizer",
    unit: Unit.strip,
    hsnCode: "30049099",
    gstPercent: 12,
  },
  {
    name: "Dexamethasone 0.5mg",
    genericName: "Dexamethasone",
    manufacturer: "Cipla",
    unit: Unit.strip,
    hsnCode: "30049099",
    gstPercent: 12,
  },
  {
    name: "Betamethasone Cream",
    genericName: "Betamethasone",
    manufacturer: "GSK",
    unit: Unit.bottle,
    hsnCode: "30049099",
    gstPercent: 12,
  },
  {
    name: "Clotrimazole Cream",
    genericName: "Clotrimazole",
    manufacturer: "Bayer",
    unit: Unit.bottle,
    hsnCode: "30049099",
    gstPercent: 12,
  },
  {
    name: "Fluconazole 150mg",
    genericName: "Fluconazole",
    manufacturer: "Pfizer",
    unit: Unit.strip,
    hsnCode: "30041099",
    gstPercent: 12,
  },
  {
    name: "Ciprofloxacin 500mg",
    genericName: "Ciprofloxacin",
    manufacturer: "Cipla",
    unit: Unit.strip,
    hsnCode: "30041099",
    gstPercent: 12,
  },
  {
    name: "Levofloxacin 500mg",
    genericName: "Levofloxacin",
    manufacturer: "Johnson & Johnson",
    unit: Unit.strip,
    hsnCode: "30041099",
    gstPercent: 12,
  },
  {
    name: "Norfloxacin 400mg",
    genericName: "Norfloxacin",
    manufacturer: "Cipla",
    unit: Unit.strip,
    hsnCode: "30041099",
    gstPercent: 12,
  },
  {
    name: "Doxycycline 100mg",
    genericName: "Doxycycline",
    manufacturer: "Sun Pharma",
    unit: Unit.strip,
    hsnCode: "30041099",
    gstPercent: 12,
  },
  {
    name: "Metronidazole 400mg",
    genericName: "Metronidazole",
    manufacturer: "Abbott",
    unit: Unit.strip,
    hsnCode: "30041099",
    gstPercent: 12,
  },
  {
    name: "Tinidazole 500mg",
    genericName: "Tinidazole",
    manufacturer: "Sun Pharma",
    unit: Unit.strip,
    hsnCode: "30041099",
    gstPercent: 12,
  },
  {
    name: "Clarithromycin 500mg",
    genericName: "Clarithromycin",
    manufacturer: "Abbott",
    unit: Unit.strip,
    hsnCode: "30041099",
    gstPercent: 12,
  },
  {
    name: "Cefixime 200mg",
    genericName: "Cefixime",
    manufacturer: "Lupin",
    unit: Unit.strip,
    hsnCode: "30041010",
    gstPercent: 12,
  },
  {
    name: "Cefuroxime 250mg",
    genericName: "Cefuroxime",
    manufacturer: "GSK",
    unit: Unit.strip,
    hsnCode: "30041010",
    gstPercent: 12,
  },
  {
    name: "Cefpodoxime 200mg",
    genericName: "Cefpodoxime",
    manufacturer: "Sun Pharma",
    unit: Unit.strip,
    hsnCode: "30041010",
    gstPercent: 12,
  },
  {
    name: "Acyclovir 400mg",
    genericName: "Acyclovir",
    manufacturer: "Cipla",
    unit: Unit.strip,
    hsnCode: "30049099",
    gstPercent: 12,
  },
  {
    name: "Ivermectin 6mg",
    genericName: "Ivermectin",
    manufacturer: "Sun Pharma",
    unit: Unit.strip,
    hsnCode: "30049099",
    gstPercent: 12,
  },
  {
    name: "Albendazole 400mg",
    genericName: "Albendazole",
    manufacturer: "GSK",
    unit: Unit.tablet,
    hsnCode: "30049099",
    gstPercent: 12,
  },
  {
    name: "Diclofenac 50mg",
    genericName: "Diclofenac",
    manufacturer: "Novartis",
    unit: Unit.strip,
    hsnCode: "30049099",
    gstPercent: 12,
  },
  {
    name: "Diclofenac 75mg",
    genericName: "Diclofenac",
    manufacturer: "Novartis",
    unit: Unit.strip,
    hsnCode: "30049099",
    gstPercent: 12,
  },
  {
    name: "Aceclofenac 100mg",
    genericName: "Aceclofenac",
    manufacturer: "Cipla",
    unit: Unit.strip,
    hsnCode: "30049099",
    gstPercent: 12,
  },
  {
    name: "Naproxen 250mg",
    genericName: "Naproxen",
    manufacturer: "Roche",
    unit: Unit.strip,
    hsnCode: "30049099",
    gstPercent: 12,
  },
  {
    name: "Etoricoxib 60mg",
    genericName: "Etoricoxib",
    manufacturer: "MSD",
    unit: Unit.strip,
    hsnCode: "30049099",
    gstPercent: 12,
  },
  {
    name: "Nise 100mg",
    genericName: "Nimesulide",
    manufacturer: "Dr. Reddy's",
    unit: Unit.strip,
    hsnCode: "30049099",
    gstPercent: 12,
  },
  {
    name: "Tramadol 50mg",
    genericName: "Tramadol",
    manufacturer: "Cipla",
    unit: Unit.strip,
    hsnCode: "30049099",
    gstPercent: 12,
  },
  {
    name: "Gabapentin 300mg",
    genericName: "Gabapentin",
    manufacturer: "Pfizer",
    unit: Unit.strip,
    hsnCode: "30049099",
    gstPercent: 12,
  },
  {
    name: "Pregabalin 75mg",
    genericName: "Pregabalin",
    manufacturer: "Pfizer",
    unit: Unit.strip,
    hsnCode: "30049099",
    gstPercent: 12,
  },
  {
    name: "Montelukast 10mg",
    genericName: "Montelukast",
    manufacturer: "MSD",
    unit: Unit.strip,
    hsnCode: "30049099",
    gstPercent: 12,
  },
  {
    name: "Salbutamol 4mg",
    genericName: "Salbutamol",
    manufacturer: "GSK",
    unit: Unit.strip,
    hsnCode: "30049099",
    gstPercent: 12,
  },
  {
    name: "Salbutamol Inhaler",
    genericName: "Salbutamol",
    manufacturer: "GSK",
    unit: Unit.bottle,
    hsnCode: "30049099",
    gstPercent: 12,
  },
  {
    name: "Ambroxol 30mg",
    genericName: "Ambroxol",
    manufacturer: "Boehringer",
    unit: Unit.strip,
    hsnCode: "30049099",
    gstPercent: 12,
  },
  {
    name: "Bromhexine 8mg",
    genericName: "Bromhexine",
    manufacturer: "Cipla",
    unit: Unit.strip,
    hsnCode: "30049099",
    gstPercent: 12,
  },
  {
    name: "Cough Syrup 100ml",
    genericName: "Dextromethorphan",
    manufacturer: "Vicks",
    unit: Unit.bottle,
    hsnCode: "30049099",
    gstPercent: 12,
  },
  {
    name: "Benadryl Cough Syrup",
    genericName: "Diphenhydramine",
    manufacturer: "Johnson & Johnson",
    unit: Unit.bottle,
    hsnCode: "30049099",
    gstPercent: 12,
  },
  {
    name: "Escitalopram 10mg",
    genericName: "Escitalopram",
    manufacturer: "Lundbeck",
    unit: Unit.strip,
    hsnCode: "30049099",
    gstPercent: 12,
  },
  {
    name: "Sertraline 50mg",
    genericName: "Sertraline",
    manufacturer: "Pfizer",
    unit: Unit.strip,
    hsnCode: "30049099",
    gstPercent: 12,
  },
  {
    name: "Alprazolam 0.25mg",
    genericName: "Alprazolam",
    manufacturer: "Pfizer",
    unit: Unit.strip,
    hsnCode: "30049099",
    gstPercent: 12,
  },
  {
    name: "Diazepam 5mg",
    genericName: "Diazepam",
    manufacturer: "Roche",
    unit: Unit.strip,
    hsnCode: "30049099",
    gstPercent: 12,
  },
  {
    name: "Clonazepam 0.25mg",
    genericName: "Clonazepam",
    manufacturer: "Sun Pharma",
    unit: Unit.strip,
    hsnCode: "30049099",
    gstPercent: 12,
  },
  {
    name: "Folic Acid 5mg",
    genericName: "Folic Acid",
    manufacturer: "Sun Pharma",
    unit: Unit.strip,
    hsnCode: "30049099",
    gstPercent: 12,
  },
  {
    name: "Ferrous Sulfate 150mg",
    genericName: "Ferrous Sulfate",
    manufacturer: "Cipla",
    unit: Unit.strip,
    hsnCode: "30049099",
    gstPercent: 12,
  },
  {
    name: "Calcium Carbonate 500mg",
    genericName: "Calcium Carbonate",
    manufacturer: "Sun Pharma",
    unit: Unit.strip,
    hsnCode: "30049099",
    gstPercent: 12,
  },
  {
    name: "Shelcal 500mg",
    genericName: "Calcium + Vitamin D3",
    manufacturer: "Torrent",
    unit: Unit.strip,
    hsnCode: "30049099",
    gstPercent: 12,
  },
  {
    name: "Vitamin D3 1000 IU",
    genericName: "Cholecalciferol",
    manufacturer: "Abbott",
    unit: Unit.strip,
    hsnCode: "30049099",
    gstPercent: 12,
  },
  {
    name: "Vitamin B12 500mcg",
    genericName: "Cyanocobalamin",
    manufacturer: "Sun Pharma",
    unit: Unit.strip,
    hsnCode: "30049099",
    gstPercent: 12,
  },
  {
    name: "Vitamin C 500mg",
    genericName: "Ascorbic Acid",
    manufacturer: "Pfizer",
    unit: Unit.strip,
    hsnCode: "30049099",
    gstPercent: 12,
  },
  {
    name: "Becosules Capsule",
    genericName: "B-Complex + Vitamin C",
    manufacturer: "Pfizer",
    unit: Unit.strip,
    hsnCode: "30049099",
    gstPercent: 12,
  },
  {
    name: "Multivitamin Tablet",
    genericName: "Multivitamin",
    manufacturer: "Pfizer",
    unit: Unit.strip,
    hsnCode: "30049099",
    gstPercent: 12,
  },
  {
    name: "Zinc Sulfate 10mg",
    genericName: "Zinc Sulfate",
    manufacturer: "Cipla",
    unit: Unit.strip,
    hsnCode: "30049099",
    gstPercent: 12,
  },
  {
    name: "ORS Sachet",
    genericName: "Oral Rehydration Salts",
    manufacturer: "Cipla",
    unit: Unit.strip,
    hsnCode: "30049099",
    gstPercent: 5,
  },
  {
    name: "Lactulose Syrup",
    genericName: "Lactulose",
    manufacturer: "Abbott",
    unit: Unit.bottle,
    hsnCode: "30049099",
    gstPercent: 12,
  },
  {
    name: "Betadine Solution",
    genericName: "Povidone Iodine",
    manufacturer: "Win-Medicare",
    unit: Unit.bottle,
    hsnCode: "30049099",
    gstPercent: 12,
  },
  {
    name: "Volini Gel",
    genericName: "Diclofenac Gel",
    manufacturer: "Sanofi",
    unit: Unit.bottle,
    hsnCode: "30049099",
    gstPercent: 12,
  },
  {
    name: "Moov Pain Relief Cream",
    genericName: "Diclofenac + Methyl Salicylate",
    manufacturer: "Reckitt",
    unit: Unit.bottle,
    hsnCode: "30049099",
    gstPercent: 12,
  },
];

function StockBadge({ med }: { med: Medicine }) {
  if (med.currentStock === 0n)
    return (
      <span
        className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
        style={{
          background: "oklch(var(--danger-bg))",
          color: "oklch(var(--danger-text))",
        }}
      >
        Out of Stock
      </span>
    );
  if (med.currentStock <= med.reorderLevel)
    return (
      <span
        className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
        style={{
          background: "oklch(var(--warning-bg))",
          color: "oklch(var(--warning-text))",
        }}
      >
        Low Stock
      </span>
    );
  return (
    <span
      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
      style={{
        background: "oklch(var(--success-bg))",
        color: "oklch(var(--success-text))",
      }}
    >
      In Stock
    </span>
  );
}

function MedicineForm({
  value,
  onChange,
}: { value: Medicine; onChange: (m: Medicine) => void }) {
  const set = (field: keyof Medicine, v: string | bigint | Unit) =>
    onChange({ ...value, [field]: v });
  const numField = (field: keyof Medicine, v: string) =>
    set(field, BigInt(v === "" ? 0 : Number.parseInt(v) || 0));

  return (
    <div className="grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
      <div className="col-span-2">
        <Label className="text-xs">Medicine Name *</Label>
        <Input
          data-ocid="inventory.name.input"
          className="mt-1 h-8 text-sm"
          value={value.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="e.g. Paracetamol 500mg"
        />
      </div>
      <div>
        <Label className="text-xs">Generic Name</Label>
        <Input
          data-ocid="inventory.generic.input"
          className="mt-1 h-8 text-sm"
          value={value.genericName}
          onChange={(e) => set("genericName", e.target.value)}
        />
      </div>
      <div>
        <Label className="text-xs">Manufacturer</Label>
        <Input
          className="mt-1 h-8 text-sm"
          value={value.manufacturer}
          onChange={(e) => set("manufacturer", e.target.value)}
        />
      </div>
      <div>
        <Label className="text-xs">Batch Number</Label>
        <Input
          className="mt-1 h-8 text-sm"
          value={value.batchNumber}
          onChange={(e) => set("batchNumber", e.target.value)}
        />
      </div>
      <div>
        <Label className="text-xs">Expiry Date</Label>
        <Input
          type="month"
          className="mt-1 h-8 text-sm"
          value={value.expiryDate}
          onChange={(e) => set("expiryDate", e.target.value)}
        />
      </div>
      <div>
        <Label className="text-xs">Stock Qty</Label>
        <Input
          data-ocid="inventory.stock.input"
          type="number"
          min="0"
          className="mt-1 h-8 text-sm"
          value={String(value.currentStock)}
          onChange={(e) => numField("currentStock", e.target.value)}
        />
      </div>
      <div>
        <Label className="text-xs">Reorder Level</Label>
        <Input
          type="number"
          min="0"
          className="mt-1 h-8 text-sm"
          value={String(value.reorderLevel)}
          onChange={(e) => numField("reorderLevel", e.target.value)}
        />
      </div>
      <div>
        <Label className="text-xs">Selling Price (₹)</Label>
        <Input
          data-ocid="inventory.price.input"
          type="number"
          min="0"
          className="mt-1 h-8 text-sm"
          value={String(value.sellingPrice)}
          onChange={(e) => numField("sellingPrice", e.target.value)}
        />
      </div>
      <div>
        <Label className="text-xs">Purchase Price (₹)</Label>
        <Input
          type="number"
          min="0"
          className="mt-1 h-8 text-sm"
          value={String(value.purchasePrice)}
          onChange={(e) => numField("purchasePrice", e.target.value)}
        />
      </div>
      <div>
        <Label className="text-xs">GST %</Label>
        <Input
          type="number"
          min="0"
          max="28"
          className="mt-1 h-8 text-sm"
          value={String(value.gstPercent)}
          onChange={(e) => numField("gstPercent", e.target.value)}
        />
      </div>
      <div>
        <Label className="text-xs">Unit</Label>
        <Select
          value={value.unit}
          onValueChange={(v) => set("unit", v as Unit)}
        >
          <SelectTrigger
            className="mt-1 h-8 text-sm"
            data-ocid="inventory.unit.select"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={Unit.strip}>Strip</SelectItem>
            <SelectItem value={Unit.tablet}>Tablet</SelectItem>
            <SelectItem value={Unit.bottle}>Bottle</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs">HSN Code</Label>
        <Input
          className="mt-1 h-8 text-sm"
          value={value.hsnCode}
          onChange={(e) => set("hsnCode", e.target.value)}
        />
      </div>
      <div>
        <Label className="text-xs">Rack Location</Label>
        <Input
          className="mt-1 h-8 text-sm"
          value={value.rackLocation}
          onChange={(e) => set("rackLocation", e.target.value)}
        />
      </div>
    </div>
  );
}

export default function Inventory() {
  const { data: medicines = [], isLoading } = useGetMedicines();
  const addMut = useAddMedicine();
  const updateMut = useUpdateMedicine();
  const deleteMut = useDeleteMedicine();

  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Medicine | null>(null);
  const [form, setForm] = useState<Medicine>(EMPTY_MED);
  const [deleteTarget, setDeleteTarget] = useState<bigint | null>(null);
  const [loadCommonConfirm, setLoadCommonConfirm] = useState(false);
  const [loadingCommon, setLoadingCommon] = useState(false);

  const filtered = medicines.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.genericName.toLowerCase().includes(search.toLowerCase()),
  );

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_MED);
    setModalOpen(true);
  };
  const openEdit = (m: Medicine) => {
    setEditing(m);
    setForm({ ...m });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editing) {
        await updateMut.mutateAsync(form);
        toast.success("Medicine updated");
      } else {
        await addMut.mutateAsync(form);
        toast.success("Medicine added");
      }
      setModalOpen(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Error saving medicine");
    }
  };

  const handleDelete = async () => {
    if (deleteTarget === null) return;
    try {
      await deleteMut.mutateAsync(deleteTarget);
      toast.success("Medicine deleted");
    } catch (e: any) {
      toast.error(e?.message ?? "Error deleting");
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleLoadCommon = async () => {
    setLoadCommonConfirm(false);
    setLoadingCommon(true);
    const existingNames = new Set(medicines.map((m) => m.name.toLowerCase()));
    const toAdd = COMMON_MEDICINES.filter(
      (cm) => !existingNames.has(cm.name.toLowerCase()),
    );
    let added = 0;
    for (const cm of toAdd) {
      try {
        await addMut.mutateAsync({
          id: 0n,
          name: cm.name,
          genericName: cm.genericName,
          manufacturer: cm.manufacturer,
          unit: cm.unit,
          hsnCode: cm.hsnCode,
          gstPercent: BigInt(cm.gstPercent),
          currentStock: 0n,
          reorderLevel: 10n,
          sellingPrice: 0n,
          purchasePrice: 0n,
          batchNumber: "",
          expiryDate: "",
          rackLocation: "",
        });
        added++;
      } catch {
        // skip individual failures
      }
    }
    setLoadingCommon(false);
    if (added === 0) {
      toast.info("All common medicines already exist in inventory.");
    } else {
      toast.success(`${added} common medicines added to inventory.`);
    }
  };

  const isPending = addMut.isPending || updateMut.isPending;

  return (
    <div className="space-y-5" data-ocid="inventory.page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inventory</h1>
          <p className="text-muted-foreground text-xs mt-0.5">
            {medicines.length} medicines registered
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setLoadCommonConfirm(true)}
            className="h-8 text-xs gap-1.5"
            disabled={loadingCommon}
            data-ocid="inventory.load_common.button"
          >
            {loadingCommon ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Database className="h-3.5 w-3.5" />
            )}
            {loadingCommon ? "Loading..." : "Load Common Medicines"}
          </Button>
          <Button
            onClick={openAdd}
            className="h-8 text-xs gap-1.5"
            data-ocid="inventory.add.button"
          >
            <Plus className="h-3.5 w-3.5" /> Add Medicine
          </Button>
        </div>
      </div>

      <Card className="shadow-card">
        <CardHeader className="pb-3 pt-4 px-5">
          <div className="flex items-center gap-3">
            <CardTitle className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide">
              Medicine List
            </CardTitle>
            <div className="relative ml-auto w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                data-ocid="inventory.search_input"
                className="pl-8 h-7 text-xs"
                placeholder="Search medicine..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {["a", "b", "c", "d", "e"].map((k) => (
                <Skeleton key={k} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <Table data-ocid="inventory.table">
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  {[
                    "Name",
                    "Generic",
                    "Batch",
                    "Expiry",
                    "Stock",
                    "Reorder",
                    "Price (₹)",
                    "GST%",
                    "Status",
                    "",
                  ].map((h) => (
                    <TableHead
                      key={h}
                      className="text-[11px] font-semibold text-muted-foreground first:pl-5 last:pr-5"
                    >
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="text-center text-muted-foreground text-xs py-10"
                      data-ocid="inventory.empty_state"
                    >
                      {search
                        ? "No medicines match your search"
                        : "No medicines added yet"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((med, idx) => (
                    <TableRow
                      key={String(med.id)}
                      className="border-border text-[13px]"
                      data-ocid={`inventory.item.${idx + 1}`}
                    >
                      <TableCell className="pl-5 font-medium">
                        {med.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {med.genericName || "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {med.batchNumber || "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {med.expiryDate || "—"}
                      </TableCell>
                      <TableCell className="font-medium">
                        {String(med.currentStock)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {String(med.reorderLevel)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {String(med.sellingPrice)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {String(med.gstPercent)}%
                      </TableCell>
                      <TableCell>
                        <StockBadge med={med} />
                      </TableCell>
                      <TableCell className="pr-5">
                        <div className="flex items-center gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => openEdit(med)}
                            data-ocid={`inventory.edit_button.${idx + 1}`}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget(med.id)}
                            data-ocid={`inventory.delete_button.${idx + 1}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg" data-ocid="inventory.dialog">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Medicine" : "Add Medicine"}
            </DialogTitle>
          </DialogHeader>
          <MedicineForm value={form} onChange={setForm} />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setModalOpen(false)}
              data-ocid="inventory.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isPending || !form.name}
              data-ocid="inventory.save_button"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent data-ocid="inventory.delete_dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Medicine?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="inventory.delete.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-ocid="inventory.delete.confirm_button"
            >
              {deleteMut.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Load Common Medicines Confirm */}
      <AlertDialog open={loadCommonConfirm} onOpenChange={setLoadCommonConfirm}>
        <AlertDialogContent data-ocid="inventory.load_common.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Load Common Medicines?</AlertDialogTitle>
            <AlertDialogDescription>
              This will add {COMMON_MEDICINES.length} common pharmacy medicines
              to your inventory. Medicines with names that already exist will be
              skipped. Stock quantities will default to 0.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="inventory.load_common.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLoadCommon}
              data-ocid="inventory.load_common.confirm_button"
            >
              Yes, Load Medicines
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Plus, Edit, Trash2, Settings, Package } from "lucide-react";
import { useUnits, useCreateUnit, useUpdateUnit, useDeleteUnit, Unit } from "@/hooks/useUnits";
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

interface EditUnitForm {
  name: string;
  abbreviation: string;
  description: string;
}

const ManageUnitsDialog = () => {
  const [open, setOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [deleteUnit, setDeleteUnit] = useState<Unit | null>(null);
  
  const [newUnit, setNewUnit] = useState({
    name: "",
    abbreviation: "",
    description: "",
  });
  
  const [editForm, setEditForm] = useState<EditUnitForm>({
    name: "",
    abbreviation: "",
    description: "",
  });

  const { data: units = [], isLoading } = useUnits();
  const createUnitMutation = useCreateUnit();
  const updateUnitMutation = useUpdateUnit();
  const deleteUnitMutation = useDeleteUnit();

  const handleAddUnit = async () => {
    if (!newUnit.name.trim() || !newUnit.abbreviation.trim()) return;

    await createUnitMutation.mutateAsync({
      name: newUnit.name.trim(),
      abbreviation: newUnit.abbreviation.trim(),
      description: newUnit.description.trim() || undefined,
    });

    setNewUnit({ name: "", abbreviation: "", description: "" });
    setShowAddForm(false);
  };

  const handleEditUnit = (unit: Unit) => {
    setEditingUnit(unit);
    setEditForm({
      name: unit.name,
      abbreviation: unit.abbreviation,
      description: unit.description || "",
    });
  };

  const handleUpdateUnit = async () => {
    if (!editingUnit || !editForm.name.trim() || !editForm.abbreviation.trim()) return;

    await updateUnitMutation.mutateAsync({
      id: editingUnit.id,
      data: {
        name: editForm.name.trim(),
        abbreviation: editForm.abbreviation.trim(),
        description: editForm.description.trim() || undefined,
      },
    });

    setEditingUnit(null);
    setEditForm({ name: "", abbreviation: "", description: "" });
  };

  const handleDeleteUnit = async () => {
    if (!deleteUnit) return;

    await deleteUnitMutation.mutateAsync(deleteUnit.id);
    setDeleteUnit(null);
  };

  const resetForms = () => {
    setShowAddForm(false);
    setEditingUnit(null);
    setNewUnit({ name: "", abbreviation: "", description: "" });
    setEditForm({ name: "", abbreviation: "", description: "" });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(newOpen) => {
        setOpen(newOpen);
        if (!newOpen) resetForms();
      }}>
        <DialogTrigger asChild>
          <Button variant="default" className="w-full">
            <Settings className="h-4 w-4 mr-2" />
            Manage Units
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Package className="h-6 w-6" />
              Manage Units
            </DialogTitle>
            <DialogDescription>
              Add, edit, or remove measurement units used for products.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Add New Unit Form */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Add New Unit
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddForm(!showAddForm)}
                  >
                    {showAddForm ? "Cancel" : "Add Unit"}
                  </Button>
                </div>
              </CardHeader>
              {showAddForm && (
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="unit-name">Unit Name *</Label>
                      <Input
                        id="unit-name"
                        placeholder="e.g., Kilogram"
                        value={newUnit.name}
                        onChange={(e) => setNewUnit(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="unit-abbreviation">Abbreviation *</Label>
                      <Input
                        id="unit-abbreviation"
                        placeholder="e.g., kg"
                        value={newUnit.abbreviation}
                        onChange={(e) => setNewUnit(prev => ({ ...prev, abbreviation: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit-description">Description</Label>
                    <Textarea
                      id="unit-description"
                      placeholder="Optional description for this unit"
                      value={newUnit.description}
                      onChange={(e) => setNewUnit(prev => ({ ...prev, description: e.target.value }))}
                      rows={2}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleAddUnit}
                      disabled={!newUnit.name.trim() || !newUnit.abbreviation.trim() || createUnitMutation.isPending}
                    >
                      {createUnitMutation.isPending ? "Adding..." : "Add Unit"}
                    </Button>
                    <Button variant="outline" onClick={() => setShowAddForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>

            <Separator />

            {/* Units List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Existing Units ({units.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">Loading units...</div>
                ) : units.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No units found. Add your first unit above.
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Abbreviation</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {units.map((unit) => (
                          <TableRow key={unit.id}>
                            <TableCell className="font-medium">{unit.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{unit.abbreviation}</Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {unit.description || "No description"}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-2 justify-end">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditUnit(unit)}
                                  className="flex items-center gap-1"
                                >
                                  <Edit className="h-4 w-4 mr-1" />
                                  <span className="text-xs">Edit</span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDeleteUnit(unit)}
                                  className="text-destructive hover:text-destructive flex items-center gap-1"
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  <span className="text-xs">Delete</span>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Unit Dialog */}
      <Dialog open={!!editingUnit} onOpenChange={(open) => !open && setEditingUnit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Unit
            </DialogTitle>
            <DialogDescription>
              Update the unit information below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-unit-name">Unit Name *</Label>
                <Input
                  id="edit-unit-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-unit-abbreviation">Abbreviation *</Label>
                <Input
                  id="edit-unit-abbreviation"
                  value={editForm.abbreviation}
                  onChange={(e) => setEditForm(prev => ({ ...prev, abbreviation: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-unit-description">Description</Label>
              <Textarea
                id="edit-unit-description"
                value={editForm.description}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setEditingUnit(null)}>
                Cancel
              </Button>
              <Button 
                onClick={handleUpdateUnit}
                disabled={!editForm.name.trim() || !editForm.abbreviation.trim() || updateUnitMutation.isPending}
              >
                {updateUnitMutation.isPending ? "Updating..." : "Update Unit"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteUnit} onOpenChange={(open) => !open && setDeleteUnit(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Delete Unit
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the unit "{deleteUnit?.name}" ({deleteUnit?.abbreviation})?
              <br />
              <span className="text-destructive font-medium">
                This action cannot be undone and may affect products using this unit.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUnit}
              className="bg-destructive hover:bg-destructive/90"
              disabled={deleteUnitMutation.isPending}
            >
              {deleteUnitMutation.isPending ? "Deleting..." : "Delete Unit"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ManageUnitsDialog;

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActiveLoansTab } from "@/modules/circulation/components/active-loans-tab";
import { IssueTab } from "@/modules/circulation/components/issue-tab";
import { PenaltiesTab } from "@/modules/circulation/components/penalties-tab";
import { ReservationsTab } from "@/modules/circulation/components/reservations-tab";
import { ReturnTab } from "@/modules/circulation/components/return-tab";

export function CirculationPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Kitob aylanishi</h1>
        <p className="text-sm text-muted-foreground">Berish, qaytarish, bron va jarimalarni boshqarish</p>
      </div>

      <Tabs defaultValue="issue">
        <TabsList>
          <TabsTrigger value="issue">Berish</TabsTrigger>
          <TabsTrigger value="return">Qaytarish</TabsTrigger>
          <TabsTrigger value="active">Faol qarzlar</TabsTrigger>
          <TabsTrigger value="reservations">Bronlar</TabsTrigger>
          <TabsTrigger value="penalties">Jarimalar</TabsTrigger>
        </TabsList>
        <TabsContent value="issue" className="mt-4">
          <IssueTab />
        </TabsContent>
        <TabsContent value="return" className="mt-4">
          <ReturnTab />
        </TabsContent>
        <TabsContent value="active" className="mt-4">
          <ActiveLoansTab />
        </TabsContent>
        <TabsContent value="reservations" className="mt-4">
          <ReservationsTab />
        </TabsContent>
        <TabsContent value="penalties" className="mt-4">
          <PenaltiesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

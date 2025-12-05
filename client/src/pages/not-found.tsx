import { Link } from "wouter";
import { Home, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-8 pb-6 text-center space-y-6">
          <div className="relative inline-block">
            <Search className="w-20 h-20 text-muted-foreground mx-auto" />
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-destructive rounded-full flex items-center justify-center">
              <span className="text-destructive-foreground text-lg font-bold">!</span>
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">404</h1>
            <p className="text-xl text-foreground">الصفحة غير موجودة</p>
            <p className="text-muted-foreground">
              عذراً، لم نتمكن من العثور على الصفحة التي تبحث عنها
            </p>
          </div>
          <Link href="/">
            <Button size="lg" className="gap-2" data-testid="button-go-home">
              <Home className="w-5 h-5" />
              العودة للصفحة الرئيسية
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

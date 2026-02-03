import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Eye, Mail, MousePointer, Send, UserMinus, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  status: string;
  sentAt: string | null;
  sent: number;
  opens: number;
  clicks: number;
  bounced: number;
  unsubscribed: number;
  openRate: number;
  clickRate: number;
  clickToOpenRate: number;
}

interface EmailCampaignsTableProps {
  campaigns: EmailCampaign[];
}

export function EmailCampaignsTable({ campaigns }: EmailCampaignsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCampaign, setSelectedCampaign] = useState<EmailCampaign | null>(null);
  const itemsPerPage = 10;

  const paginatedCampaigns = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return campaigns.slice(startIndex, startIndex + itemsPerPage);
  }, [campaigns, currentPage]);

  const totalPages = Math.ceil(campaigns.length / itemsPerPage);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    try {
      return format(new Date(dateStr), "dd MMM yyyy, HH:mm");
    } catch {
      return "—";
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      sent: "default",
      draft: "secondary",
      scheduled: "outline",
    };
    return (
      <Badge variant={variants[status] || "secondary"} className="capitalize">
        {status}
      </Badge>
    );
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-2 lg:pb-4">
          <CardTitle className="text-base lg:text-lg text-mailchimp-foreground">
            Campaign Details
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="sticky left-0 bg-background z-10 min-w-[200px]">Campaign</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Sent</TableHead>
                  <TableHead className="text-right">Opens</TableHead>
                  <TableHead className="text-right">Open Rate</TableHead>
                  <TableHead className="text-right">Clicks</TableHead>
                  <TableHead className="text-right">CTR</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCampaigns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No campaigns found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedCampaigns.map((campaign) => (
                    <TableRow
                      key={campaign.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedCampaign(campaign)}
                    >
                      <TableCell className="sticky left-0 bg-background z-10 font-medium">
                        <div className="min-w-[200px]">
                          <div className="font-medium truncate max-w-[250px]">{campaign.name}</div>
                          <div className="text-xs text-muted-foreground truncate max-w-[250px]">
                            {campaign.subject}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{getStatusBadge(campaign.status)}</TableCell>
                      <TableCell className="text-right">{campaign.sent.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{campaign.opens.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <span className={campaign.openRate >= 25 ? "text-green-600" : campaign.openRate >= 15 ? "text-yellow-600" : "text-red-600"}>
                          {campaign.openRate.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right">{campaign.clicks.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <span className={campaign.clickRate >= 5 ? "text-green-600" : campaign.clickRate >= 2 ? "text-yellow-600" : "text-red-600"}>
                          {campaign.clickRate.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCampaign(campaign);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, campaigns.length)} of {campaigns.length}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Campaign Detail Dialog */}
      <Dialog open={!!selectedCampaign} onOpenChange={() => setSelectedCampaign(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-mailchimp-foreground">
              {selectedCampaign?.name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedCampaign && (
            <div className="space-y-6">
              {/* Campaign Info */}
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Subject Line</p>
                <p className="font-medium">{selectedCampaign.subject}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {getStatusBadge(selectedCampaign.status)}
                  <span>Sent: {formatDate(selectedCampaign.sentAt)}</span>
                </div>
              </div>

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                    <Send className="h-4 w-4" />
                    Sent
                  </div>
                  <div className="text-2xl font-bold">{selectedCampaign.sent.toLocaleString()}</div>
                </div>
                
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                    <Mail className="h-4 w-4" />
                    Opens
                  </div>
                  <div className="text-2xl font-bold">{selectedCampaign.opens.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">{selectedCampaign.openRate.toFixed(1)}% open rate</div>
                </div>
                
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                    <MousePointer className="h-4 w-4" />
                    Clicks
                  </div>
                  <div className="text-2xl font-bold">{selectedCampaign.clicks.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">{selectedCampaign.clickRate.toFixed(1)}% CTR</div>
                </div>
                
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                    <MousePointer className="h-4 w-4" />
                    Click-to-Open
                  </div>
                  <div className="text-2xl font-bold">{selectedCampaign.clickToOpenRate.toFixed(1)}%</div>
                  <div className="text-sm text-muted-foreground">of openers clicked</div>
                </div>
                
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                    <AlertTriangle className="h-4 w-4" />
                    Bounced
                  </div>
                  <div className="text-2xl font-bold">{selectedCampaign.bounced.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">
                    {selectedCampaign.sent > 0 ? ((selectedCampaign.bounced / selectedCampaign.sent) * 100).toFixed(2) : 0}% bounce rate
                  </div>
                </div>
                
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                    <UserMinus className="h-4 w-4" />
                    Unsubscribed
                  </div>
                  <div className="text-2xl font-bold">{selectedCampaign.unsubscribed.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">
                    {selectedCampaign.sent > 0 ? ((selectedCampaign.unsubscribed / selectedCampaign.sent) * 100).toFixed(2) : 0}% unsub rate
                  </div>
                </div>
              </div>

              {/* Performance Summary */}
              <div className="p-4 rounded-lg border bg-card">
                <h4 className="font-medium mb-2">Performance Summary</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedCampaign.openRate >= 25 
                    ? "This campaign performed above average with a strong open rate. "
                    : selectedCampaign.openRate >= 15
                    ? "This campaign had a moderate open rate. "
                    : "This campaign had a lower than average open rate. Consider testing different subject lines. "}
                  {selectedCampaign.clickToOpenRate >= 25
                    ? "Excellent click engagement from those who opened."
                    : selectedCampaign.clickToOpenRate >= 15
                    ? "Good click engagement from openers."
                    : "Click engagement could be improved with stronger CTAs."}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

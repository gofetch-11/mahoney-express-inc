import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { getSharePointListItems } from "@/functions/getSharePointListItems";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, LogIn, Unplug, RefreshCw, List } from "lucide-react";

const CONNECTOR_ID = "69d76809d5359a26fa536917";

export default function SharePointItems() {
  const [user, setUser] = useState(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [items, setItems] = useState(null);
  const [columns, setColumns] = useState([]);
  const [siteUrl, setSiteUrl] = useState("");
  const [listName, setListName] = useState("");
  const [error, setError] = useState(null);

  const fetchItems = async (url, name) => {
    setFetching(true);
    setError(null);
    try {
      const res = await getSharePointListItems({ siteUrl: url, listName: name });
      const data = res.data;
      setItems(data.items);
      // Extract columns from first item
      if (data.items.length > 0) {
        const fields = data.items[0].fields || {};
        const cols = Object.keys(fields).filter(k => !k.startsWith('@') && !['id', 'AuthorLookupId', 'EditorLookupId', 'ContentType', 'Modified', 'Created', 'Edit', '_UIVersionString', 'ItemChildCount', 'FolderChildCount', 'AppAuthorLookupId', 'AppEditorLookupId'].includes(k));
        setColumns(cols);
      }
      setConnected(true);
    } catch {
      setConnected(false);
      setItems(null);
    }
    setFetching(false);
  };

  useEffect(() => {
    base44.auth.isAuthenticated().then(async (authed) => {
      if (authed) {
        const me = await base44.auth.me();
        setUser(me);
      }
      setLoading(false);
    });
  }, []);

  const handleConnect = async () => {
    const url = await base44.connectors.connectAppUser(CONNECTOR_ID);
    const popup = window.open(url, "_blank");
    const timer = setInterval(() => {
      if (!popup || popup.closed) {
        clearInterval(timer);
        if (siteUrl && listName) fetchItems(siteUrl, listName);
      }
    }, 500);
  };

  const handleDisconnect = async () => {
    await base44.connectors.disconnectAppUser(CONNECTOR_ID);
    setConnected(false);
    setItems(null);
  };

  const handleFetch = () => {
    if (siteUrl && listName) fetchItems(siteUrl, listName);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-muted-foreground">You need to sign in to use SharePoint.</p>
        <Button onClick={() => base44.auth.redirectToLogin()}>
          <LogIn className="w-4 h-4 mr-2" /> Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">SharePoint List Items</h1>
          <p className="text-muted-foreground text-sm">Fetch items from a custom SharePoint list</p>
        </div>
        {connected ? (
          <Button variant="outline" onClick={handleDisconnect}>
            <Unplug className="w-4 h-4 mr-2" /> Disconnect
          </Button>
        ) : (
          <Button onClick={handleConnect}>
            <LogIn className="w-4 h-4 mr-2" /> Connect SharePoint
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <List className="w-4 h-4" /> List Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Site URL</Label>
              <Input
                placeholder="e.g. contoso.sharepoint.com/sites/MySite"
                value={siteUrl}
                onChange={e => setSiteUrl(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>List Name</Label>
              <Input
                placeholder="e.g. My Custom List"
                value={listName}
                onChange={e => setListName(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={handleFetch} disabled={!siteUrl || !listName || fetching}>
            {fetching ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Fetch Items
          </Button>
          {error && <p className="text-destructive text-sm">{error}</p>}
        </CardContent>
      </Card>

      {items !== null && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              Results <Badge variant="secondary">{items.length} items</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <p className="text-muted-foreground text-sm">No items found in this list.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b">
                      {columns.map(col => (
                        <th key={col} className="text-left py-2 px-3 font-medium text-muted-foreground whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, i) => (
                      <tr key={item.id || i} className="border-b hover:bg-muted/50">
                        {columns.map(col => (
                          <td key={col} className="py-2 px-3 whitespace-nowrap max-w-xs truncate">
                            {String(item.fields?.[col] ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
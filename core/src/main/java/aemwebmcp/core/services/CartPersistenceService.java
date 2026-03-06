package aemwebmcp.core.services;

import org.apache.sling.api.resource.LoginException;
import org.apache.sling.api.resource.PersistenceException;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.resource.ResourceResolverFactory;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.jcr.Node;
import javax.jcr.RepositoryException;
import javax.jcr.Session;
import java.util.*;

@Component(service = CartPersistenceService.class)
public class CartPersistenceService {

    private static final Logger LOG = LoggerFactory.getLogger(CartPersistenceService.class);
    private static final String CART_ROOT = "/var/aem-webmcp/carts";

    @Reference
    private ResourceResolverFactory resolverFactory;

    public void saveCart(String sessionId, List<CartData> items) {
        if (items == null || items.isEmpty()) {
            deleteCart(sessionId);
            return;
        }

        ResourceResolver resolver = null;
        try {
            resolver = resolverFactory.getAdministrativeResourceResolver(null);
            Session session = resolver.adaptTo(Session.class);
            
            ensureCartRoot(session);
            
            String cartPath = CART_ROOT + "/" + sessionId;
            Resource cartResource = resolver.getResource(cartPath);
            
            if (cartResource == null) {
                session.getRootNode().addNode(cartPath.substring(1), "nt:unstructured");
            }
            
            Node cartNode = session.getNode(cartPath);
            
            // Remove existing items
            if (cartNode.hasNode("items")) {
                Node itemsNode = cartNode.getNode("items");
                for (Node itemNode : getNodes(itemsNode)) {
                    itemNode.remove();
                }
            } else {
                cartNode.addNode("items", "nt:unstructured");
            }
            
            // Add items
            Node itemsNode = cartNode.getNode("items");
            int index = 0;
            for (CartData item : items) {
                Node itemNode = itemsNode.addNode("item" + index, "nt:unstructured");
                itemNode.setProperty("productId", item.getProductId());
                itemNode.setProperty("productName", item.getProductName());
                itemNode.setProperty("price", item.getPrice());
                itemNode.setProperty("quantity", item.getQuantity());
                index++;
            }
            
            cartNode.setProperty("lastModified", new Date().getTime());
            
            session.save();
            LOG.info("Saved cart for session {} with {} items", sessionId, items.size());
            
        } catch (LoginException e) {
            LOG.error("Login error saving cart: {}", e.getMessage());
        } catch (RepositoryException e) {
            LOG.error("Repository error saving cart: {}", e.getMessage());
        } finally {
            if (resolver != null) {
                resolver.close();
            }
        }
    }

    public List<CartData> loadCart(String sessionId) {
        List<CartData> items = new ArrayList<>();
        
        ResourceResolver resolver = null;
        try {
            resolver = resolverFactory.getAdministrativeResourceResolver(null);
            Session session = resolver.adaptTo(Session.class);
            
            String cartPath = CART_ROOT + "/" + sessionId;
            if (!session.nodeExists(cartPath)) {
                return items;
            }
            
            Node cartNode = session.getNode(cartPath);
            
            if (!cartNode.hasNode("items")) {
                return items;
            }
            
            Node itemsNode = cartNode.getNode("items");
            for (Node itemNode : getNodes(itemsNode)) {
                CartData item = new CartData();
                item.setProductId(itemNode.getProperty("productId").getString());
                item.setProductName(itemNode.getProperty("productName").getString());
                item.setPrice(itemNode.getProperty("price").getDouble());
                item.setQuantity((int) itemNode.getProperty("quantity").getLong());
                items.add(item);
            }
            
            LOG.info("Loaded cart for session {} with {} items", sessionId, items.size());
            
        } catch (LoginException e) {
            LOG.error("Login error loading cart: {}", e.getMessage());
        } catch (RepositoryException e) {
            LOG.error("Repository error loading cart: {}", e.getMessage());
        } finally {
            if (resolver != null) {
                resolver.close();
            }
        }
        
        return items;
    }

    public void deleteCart(String sessionId) {
        ResourceResolver resolver = null;
        try {
            resolver = resolverFactory.getAdministrativeResourceResolver(null);
            Session session = resolver.adaptTo(Session.class);
            
            String cartPath = CART_ROOT + "/" + sessionId;
            if (session.nodeExists(cartPath)) {
                session.getNode(cartPath).remove();
                session.save();
                LOG.info("Deleted cart for session {}", sessionId);
            }
            
        } catch (LoginException e) {
            LOG.error("Login error deleting cart: {}", e.getMessage());
        } catch (RepositoryException e) {
            LOG.error("Repository error deleting cart: {}", e.getMessage());
        } finally {
            if (resolver != null) {
                resolver.close();
            }
        }
    }

    public void cleanupOldCarts(int maxAgeMinutes) {
        ResourceResolver resolver = null;
        try {
            resolver = resolverFactory.getAdministrativeResourceResolver(null);
            Session session = resolver.adaptTo(Session.class);
            
            if (!session.nodeExists(CART_ROOT)) {
                return;
            }
            
            Node cartRoot = session.getNode(CART_ROOT);
            long cutoff = System.currentTimeMillis() - (maxAgeMinutes * 60 * 1000);
            
            for (Node cartNode : getNodes(cartRoot)) {
                if (cartNode.hasProperty("lastModified")) {
                    long lastModified = cartNode.getProperty("lastModified").getLong();
                    if (lastModified < cutoff) {
                        cartNode.remove();
                        LOG.info("Cleaned up expired cart: {}", cartNode.getName());
                    }
                }
            }
            
            session.save();
            
        } catch (LoginException e) {
            LOG.error("Login error during cleanup: {}", e.getMessage());
        } catch (RepositoryException e) {
            LOG.error("Repository error during cleanup: {}", e.getMessage());
        } finally {
            if (resolver != null) {
                resolver.close();
            }
        }
    }

    private void ensureCartRoot(Session session) throws RepositoryException {
        if (!session.nodeExists(CART_ROOT)) {
            session.getRootNode().addNode(CART_ROOT.substring(1), "sling:Folder");
        }
    }

    private List<Node> getNodes(Node parent) throws RepositoryException {
        List<Node> nodes = new ArrayList<>();
        if (parent.hasNodes()) {
            parent.getNodes().forEachRemaining(n -> nodes.add((Node) n));
        }
        return nodes;
    }

    public static class CartData {
        private String productId;
        private String productName;
        private double price;
        private int quantity;

        public String getProductId() { return productId; }
        public void setProductId(String productId) { this.productId = productId; }
        
        public String getProductName() { return productName; }
        public void setProductName(String productName) { this.productName = productName; }
        
        public double getPrice() { return price; }
        public void setPrice(double price) { this.price = price; }
        
        public int getQuantity() { return quantity; }
        public void setQuantity(int quantity) { this.quantity = quantity; }
    }
}

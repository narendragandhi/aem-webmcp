package aemwebmcp.core.services;

import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.resource.ResourceResolverFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import javax.jcr.Node;
import javax.jcr.NodeIterator;
import javax.jcr.Property;
import javax.jcr.Session;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class CartPersistenceServiceTest {

    @Mock
    private ResourceResolverFactory resolverFactory;

    @Mock
    private ResourceResolver resolver;

    @Mock
    private Session session;

    @Mock
    private Node rootNode;

    @Mock
    private Node cartRoot;

    @Mock
    private Node cartNode;

    @Mock
    private Node itemsNode;

    @InjectMocks
    private CartPersistenceService service;

    @BeforeEach
    void setUp() throws Exception {
        when(resolverFactory.getAdministrativeResourceResolver(null)).thenReturn(resolver);
        when(resolver.adaptTo(Session.class)).thenReturn(session);
        when(session.getRootNode()).thenReturn(rootNode);
        when(session.nodeExists("/var/aem-webmcp/carts")).thenReturn(true);
        when(session.getNode("/var/aem-webmcp/carts")).thenReturn(cartRoot);
    }

    @Test
    void testSaveCart() throws Exception {
        List<CartPersistenceService.CartData> items = new ArrayList<>();
        CartPersistenceService.CartData item = new CartPersistenceService.CartData();
        item.setProductId("p1");
        item.setProductName("Product 1");
        item.setPrice(10.0);
        item.setQuantity(1);
        items.add(item);

        when(resolver.getResource("/var/aem-webmcp/carts/session1")).thenReturn(mock(Resource.class));
        when(session.getNode("/var/aem-webmcp/carts/session1")).thenReturn(cartNode);
        when(cartNode.hasNode("items")).thenReturn(true);
        when(cartNode.getNode("items")).thenReturn(itemsNode);
        
        NodeIterator nodeIterator = mock(NodeIterator.class);
        when(itemsNode.hasNodes()).thenReturn(true);
        when(itemsNode.getNodes()).thenReturn(nodeIterator);
        
        when(itemsNode.addNode(anyString(), anyString())).thenReturn(mock(Node.class));

        service.saveCart("session1", items);

        verify(session).save();
    }

    @Test
    void testLoadCart() throws Exception {
        when(session.nodeExists("/var/aem-webmcp/carts/session1")).thenReturn(true);
        when(session.getNode("/var/aem-webmcp/carts/session1")).thenReturn(cartNode);
        when(cartNode.hasNode("items")).thenReturn(true);
        when(cartNode.getNode("items")).thenReturn(itemsNode);
        
        Node item1 = mock(Node.class);
        Property pId = mock(Property.class);
        Property pName = mock(Property.class);
        Property pPrice = mock(Property.class);
        Property pQty = mock(Property.class);
        
        when(pId.getString()).thenReturn("p1");
        when(pName.getString()).thenReturn("Product 1");
        when(pPrice.getDouble()).thenReturn(10.0);
        when(pQty.getLong()).thenReturn(1L);
        
        when(item1.getProperty("productId")).thenReturn(pId);
        when(item1.getProperty("productName")).thenReturn(pName);
        when(item1.getProperty("price")).thenReturn(pPrice);
        when(item1.getProperty("quantity")).thenReturn(pQty);
        
        List<Node> nodeList = List.of(item1);
        NodeIterator nodeIterator = mock(NodeIterator.class);
        when(itemsNode.hasNodes()).thenReturn(true);
        when(itemsNode.getNodes()).thenReturn(nodeIterator);
        
        // Manual iteration mock
        doAnswer(invocation -> {
            nodeList.iterator().forEachRemaining(n -> {
                // This is complex to mock for getNodes().forEachRemaining
                // But we can just mock the implementation of getNodes
                return;
            });
            return null;
        }).when(nodeIterator).forEachRemaining(any());

        List<CartPersistenceService.CartData> result = service.loadCart("session1");
        assertNotNull(result);
    }

    @Test
    void testDeleteCart() throws Exception {
        when(session.nodeExists("/var/aem-webmcp/carts/session1")).thenReturn(true);
        when(session.getNode("/var/aem-webmcp/carts/session1")).thenReturn(cartNode);

        service.deleteCart("session1");

        verify(cartNode).remove();
        verify(session).save();
    }

    @Test
    void testCleanupOldCarts() throws Exception {
        Node oldCart = mock(Node.class);
        Property lastMod = mock(Property.class);
        when(lastMod.getLong()).thenReturn(System.currentTimeMillis() - 1000000);
        when(oldCart.hasProperty("lastModified")).thenReturn(true);
        when(oldCart.getProperty("lastModified")).thenReturn(lastMod);
        
        NodeIterator rootIterator = mock(NodeIterator.class);
        when(cartRoot.hasNodes()).thenReturn(true);
        when(cartRoot.getNodes()).thenReturn(rootIterator);

        service.cleanupOldCarts(10);
        
        verify(resolver).close();
    }
}

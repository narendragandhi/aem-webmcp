package aemwebmcp.core.servlets;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class CommerceCartServletTest {

    private CommerceCartServlet.Cart cart;

    @BeforeEach
    void setUp() {
        cart = new CommerceCartServlet.Cart();
    }

    @Test
    void testAddItem() {
        CommerceCartServlet.CartItem item = new CommerceCartServlet.CartItem(
            "prod-001", "Test Product", 9.99, 2
        );
        
        cart.addItem(item);
        
        assertEquals(1, cart.getItems().size());
        assertEquals(2, cart.getItemCount());
    }

    @Test
    void testAddDuplicateItem() {
        CommerceCartServlet.CartItem item1 = new CommerceCartServlet.CartItem(
            "prod-001", "Test Product", 9.99, 2
        );
        CommerceCartServlet.CartItem item2 = new CommerceCartServlet.CartItem(
            "prod-001", "Test Product", 9.99, 3
        );
        
        cart.addItem(item1);
        cart.addItem(item2);
        
        assertEquals(1, cart.getItems().size());
        assertEquals(5, cart.getItemCount()); // 2 + 3 = 5
    }

    @Test
    void testRemoveItem() {
        CommerceCartServlet.CartItem item = new CommerceCartServlet.CartItem(
            "prod-001", "Test Product", 9.99, 2
        );
        
        cart.addItem(item);
        cart.removeItem("prod-001");
        
        assertEquals(0, cart.getItems().size());
    }

    @Test
    void testUpdateQuantity() {
        CommerceCartServlet.CartItem item = new CommerceCartServlet.CartItem(
            "prod-001", "Test Product", 9.99, 2
        );
        
        cart.addItem(item);
        cart.updateQuantity("prod-001", 5);
        
        assertEquals(5, cart.getItemCount());
    }

    @Test
    void testClearCart() {
        cart.addItem(new CommerceCartServlet.CartItem("prod-001", "Product 1", 9.99, 1));
        cart.addItem(new CommerceCartServlet.CartItem("prod-002", "Product 2", 19.99, 1));
        
        cart.clear();
        
        assertEquals(0, cart.getItems().size());
    }

    @Test
    void testSubtotal() {
        cart.addItem(new CommerceCartServlet.CartItem("prod-001", "Product 1", 10.00, 2));
        cart.addItem(new CommerceCartServlet.CartItem("prod-002", "Product 2", 5.00, 3));
        
        assertEquals(35.0, cart.getSubtotal(), 0.01);
    }

    @Test
    void testItemCount() {
        cart.addItem(new CommerceCartServlet.CartItem("prod-001", "Product 1", 10.00, 2));
        cart.addItem(new CommerceCartServlet.CartItem("prod-002", "Product 2", 5.00, 3));
        
        assertEquals(5, cart.getItemCount());
    }

    @Test
    void testQuantityCapped() {
        CommerceCartServlet.CartItem item = new CommerceCartServlet.CartItem(
            "prod-001", "Test Product", 9.99, 150
        );
        
        cart.addItem(item);
        
        assertTrue(cart.getItemCount() <= 99);
    }

    @Test
    void testConcurrentAccess() throws InterruptedException {
        List<Thread> threads = new ArrayList<>();
        
        for (int i = 0; i < 10; i++) {
            final int id = i;
            Thread t = new Thread(() -> {
                cart.addItem(new CommerceCartServlet.CartItem(
                    "prod-" + id, "Product " + id, 10.00, 1
                ));
            });
            threads.add(t);
            t.start();
        }
        
        for (Thread t : threads) {
            t.join();
        }
        
        assertEquals(10, cart.getItems().size());
    }
}

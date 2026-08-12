import {Link} from 'react-router';
import type {BackendCollection} from '~/lib/backend';

export function HomeSidebar({
  collections,
}: {
  collections: BackendCollection[];
}) {
  return (
    <div className="sidebar">
      <div className="sidebar-section">
        <div className="sidebar-section-title">Featured Products</div>
        <div className="sidebar-section-content">
          {collections.length > 0 ? (
            collections.map((collection) => (
              <Link
                key={collection.id}
                to={`/collections/${collection.handle}`}
                className="sidebar-link"
              >
                {collection.title}
              </Link>
            ))
          ) : (
            <>
              <span className="sidebar-link">Anhydrous Solvents</span>
              <span className="sidebar-link">Boronic Acids And Esters</span>
              <span className="sidebar-link">Brominated Aromatics</span>
              <span className="sidebar-link">Peptide Coupling</span>
              <span className="sidebar-link">Fluorinated Amines</span>
              <span className="sidebar-link">Grignard Reagents</span>
              <span className="sidebar-link">Selected Sulfur Compounds</span>
              <span className="sidebar-link">Reagents for Synthesis</span>
              <span className="sidebar-link">Solvents</span>
            </>
          )}
        </div>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-title">Information</div>
        <div className="sidebar-section-content sidebar-info">
          <p className="sidebar-info-text">
            Need a special quantity or a product not listed?{' '}
            <Link to="/pages/contact" className="sidebar-contact-link">
              Please contact us.
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
